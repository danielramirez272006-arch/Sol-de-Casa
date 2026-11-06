import crypto from 'node:crypto';
import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { esTransicionValida, validarEmail, validarNumeroPositivo } from '../validators/schemas.js';
import { ReferidosService } from './referidosService.js';

export class SolicitudesService {
  /**
   * Crea una solicitud de visita desde el formulario del vecino.
   * Valida consentimiento, evita autorreferidos y previene duplicados vía idempotencyKey.
   */
  static async crearSolicitud({
    codigoReferido,
    nombreVecino,
    telefono,
    email = null,
    direccion = null,
    reciboActualUsd,
    fechaPreferencia = null,
    horarioPreferencia = null,
    consentimientoContacto,
    idempotencyKey = null,
    esSimulada = false
  }) {
    if (!consentimientoContacto) {
      throw new Error('Es necesario otorgar consentimiento de contacto para solicitar la visita técnica.');
    }
    if (!nombreVecino || nombreVecino.trim().length < 2) {
      throw new Error('El nombre es obligatorio.');
    }
    if (!telefono || telefono.trim().length < 7) {
      throw new Error('El número de teléfono o WhatsApp es obligatorio para coordinar la visita.');
    }
    if (email && !validarEmail(email)) {
      throw new Error('El correo electrónico tiene un formato inválido.');
    }

    const recibo = Number(reciboActualUsd) || 0;
    const ahorroEstimado = Math.round(recibo * env.solar.savingRate * 100) / 100;

    // Resolver atribución de referido si se suministró código
    let codigoReferidoId = null;
    let familiaReferidoraId = null;

    if (codigoReferido) {
      const infoRef = await ReferidosService.resolverInvitacionPublica(codigoReferido);
      if (infoRef.valido) {
        codigoReferidoId = infoRef.codigoReferidoId;
        familiaReferidoraId = infoRef.familiaId;

        // Comprobación anti-autorreferido: verificar si el email o teléfono coincide con la familia referidora
        const fams = await query(
          `SELECT u.email, f.telefono 
           FROM familias f 
           INNER JOIN usuarios u ON u.id = f.usuario_id 
           WHERE f.id = ?`,
          [familiaReferidoraId]
        );
        if (fams.length > 0) {
          const fam = fams[0];
          if (
            (email && fam.email && email.trim().toLowerCase() === fam.email.toLowerCase()) ||
            (telefono && fam.telefono && telefono.replace(/\D/g, '') === fam.telefono.replace(/\D/g, ''))
          ) {
            throw new Error('No es posible autorreferirse utilizando tu propio enlace o datos.');
          }
        }
      }
    }

    // Clave de idempotencia única para prevenir dobles clics o envíos concurrentes
    const claveFinal = idempotencyKey || 
      crypto.createHash('sha256').update(`${telefono.trim()}-${codigoReferido || 'directo'}-${new Date().toISOString().slice(0, 10)}`).digest('hex');

    // Comprobar idempotencia previa
    const previas = await query('SELECT id, estado FROM solicitudes_visita WHERE idempotency_key = ?', [claveFinal]);
    if (previas.length > 0) {
      return {
        ok: true,
        solicitudId: previas[0].id,
        estado: previas[0].estado,
        duplicadoDetectado: true,
        mensaje: 'La solicitud ya había sido registrada anteriormente. Nuestro equipo te contactará para confirmar la disponibilidad.'
      };
    }

    return await withTransaction(async (conn) => {
      const [res] = await conn.query(
        `INSERT INTO solicitudes_visita (
          codigo_referido_id, familia_referidora_id, nombre_vecino, telefono, email, direccion,
          recibo_actual_usd, ahorro_estimado_usd, fecha_preferencia, horario_preferencia,
          estado, consentimiento_contacto, es_simulada, idempotency_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitada', ?, ?, ?)`,
        [
          codigoReferidoId,
          familiaReferidoraId,
          nombreVecino.trim(),
          telefono.trim(),
          email ? email.trim().toLowerCase() : null,
          direccion ? direccion.trim() : null,
          recibo,
          ahorroEstimado,
          fechaPreferencia || null,
          horarioPreferencia || null,
          Boolean(consentimientoContacto),
          Boolean(esSimulada),
          claveFinal
        ]
      );

      const solicitudId = res.insertId;

      // Registrar evento de telemetría de solicitud enviada
      await conn.query(
        `INSERT INTO eventos_growth (tipo_evento, familia_id, codigo_referido, metadata)
         VALUES ('solicitud_enviada', ?, ?, ?)`,
        [familiaReferidoraId, codigoReferido, JSON.stringify({ solicitudId, recibo, fechaPreferencia })]
      );

      return {
        ok: true,
        solicitudId,
        estado: 'solicitada',
        familiaReferidoraId,
        nombreVecino: nombreVecino.trim(),
        mensaje: 'Solicitud recibida con éxito. Recuerda que la fecha elegida constituye una preferencia hasta que nuestro equipo confirme disponibilidad técnica en tu zona.'
      };
    });
  }

  /**
   * Cambia el estado de una solicitud validando la máquina de estados.
   * Transiciones: solicitada -> agendada -> realizada -> venta_confirmada / cancelada.
   */
  static async cambiarEstado(solicitudId, nuevoEstado, { notas = null, adminUsuarioId = null, fechaProgramada = null } = {}) {
    const solicitudes = await query(
      `SELECT id, estado, familia_referidora_id, codigo_referido_id, nombre_vecino 
       FROM solicitudes_visita 
       WHERE id = ?`,
      [solicitudId]
    );

    if (solicitudes.length === 0) {
      throw new Error('Solicitud no encontrada.');
    }

    const sol = solicitudes[0];
    const estadoActual = sol.estado;

    if (!esTransicionValida(estadoActual, nuevoEstado)) {
      throw new Error(`Transición no permitida: no se puede pasar de "${estadoActual}" a "${nuevoEstado}".`);
    }

    return await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE solicitudes_visita 
         SET estado = ?, notas = COALESCE(?, notas), actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [nuevoEstado, notas, solicitudId]
      );

      // Si pasa a 'agendada', se crea o actualiza el registro en visitas
      if (nuevoEstado === 'agendada') {
        const fechaVisita = fechaProgramada || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 días después por defecto
        await conn.query(
          `INSERT INTO visitas (solicitud_id, fecha_programada, estado, costo_visita_usd)
           VALUES (?, ?, 'programada', ?)
           ON DUPLICATE KEY UPDATE fecha_programada = VALUES(fecha_programada), estado = 'programada'`,
          [solicitudId, fechaVisita, env.solar.visitCost]
        );
      } else if (nuevoEstado === 'realizada') {
        await conn.query(
          `UPDATE visitas SET estado = 'realizada', resultado_visita = 'interesado' WHERE solicitud_id = ?`,
          [solicitudId]
        );
      }

      if (adminUsuarioId) {
        await conn.query(
          `INSERT INTO logs_auditoria (usuario_id, accion, entidad, entidad_id, detalles)
           VALUES (?, 'cambio_estado_solicitud', 'solicitudes_visita', ?, ?)`,
          [adminUsuarioId, solicitudId, JSON.stringify({ anterior: estadoActual, nuevo: nuevoEstado, notas })]
        );
      }

      return {
        ok: true,
        solicitudId,
        estadoAnterior: estadoActual,
        nuevoEstado,
        mensaje: `Estado actualizado a "${nuevoEstado}".`
      };
    });
  }

  /**
   * Lista las solicitudes (para el panel del administrador o filtro por familia).
   */
  static async listar({ familiaId = null, estado = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT s.id, s.codigo_referido_id, s.familia_referidora_id,
             f.nombre_familia AS familia_referidora_nombre,
             s.nombre_vecino, s.telefono, s.email, s.direccion,
             s.recibo_actual_usd, s.ahorro_estimado_usd,
             s.fecha_preferencia, s.horario_preferencia,
             s.estado, s.es_simulada, s.creado_en, s.actualizado_en,
             v.id AS visita_id, v.fecha_programada, v.estado AS estado_visita,
             vt.id AS venta_id, vt.monto_total_usd,
             r.id AS recompensa_id, r.tipo_recompensa, r.estado AS estado_recompensa
      FROM solicitudes_visita s
      LEFT JOIN familias f ON f.id = s.familia_referidora_id
      LEFT JOIN visitas v ON v.solicitud_id = s.id
      LEFT JOIN ventas vt ON vt.solicitud_id = s.id
      LEFT JOIN recompensas r ON r.venta_id = vt.id
      WHERE 1=1
    `;
    const params = [];

    if (familiaId) {
      sql += ' AND s.familia_referidora_id = ?';
      params.push(familiaId);
    }
    if (estado) {
      sql += ' AND s.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY s.creado_en DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);
    return rows;
  }
}

