import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

export class ReferidosService {
  /**
   * Genera o recupera el código personal de referido para una familia habilitada.
   * Utiliza crypto.randomBytes para crear códigos aleatorios seguros y difíciles de adivinar.
   */
  static async obtenerOCrearCodigo(familiaId) {
    const existentes = await query(
      `SELECT id, codigo, activo, creado_en 
       FROM codigos_referido 
       WHERE familia_id = ? AND activo = TRUE 
       ORDER BY id DESC LIMIT 1`,
      [familiaId]
    );

    let codigo;
    if (existentes.length > 0) {
      codigo = existentes[0].codigo;
    } else {
      // Generar código aleatorio difícil de adivinar (ej: SOL-9F3B1A2C)
      codigo = 'SOL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await query(
        `INSERT INTO codigos_referido (familia_id, codigo, activo) VALUES (?, ?, TRUE)`,
        [familiaId, codigo]
      );
    }

    const enlacePersonal = `${env.corsOrigin}/?ref=${encodeURIComponent(codigo)}#calculadora`;

    return {
      familiaId,
      codigo,
      enlacePersonal
    };
  }

  /**
   * Obtiene la información pública mínima para la invitación del vecino.
   * Expone ÚNICAMENTE los datos necesarios para contextualizar la invitación:
   * nombre de la familia (o primer nombre), ahorro mensual de referencia si está configurado,
   * sin exponer datos privados (dirección exacta, teléfono ni emails).
   */
  static async resolverInvitacionPublica(codigo) {
    if (!codigo || typeof codigo !== 'string') {
      throw new Error('Código de referido inválido.');
    }

    const codigoLimpio = codigo.trim().toUpperCase();

    const rows = await query(
      `SELECT cr.id AS codigo_referido_id, cr.codigo, cr.activo,
              f.id AS familia_id, f.nombre_familia, f.recibo_anterior_usd, f.porcentaje_ahorro_estimado
       FROM codigos_referido cr
       INNER JOIN familias f ON f.id = cr.familia_id
       WHERE cr.codigo = ? AND cr.activo = TRUE
       LIMIT 1`,
      [codigoLimpio]
    );

    if (rows.length === 0) {
      return {
        valido: false,
        mensaje: 'El enlace o código de referido no existe o ya no se encuentra activo.'
      };
    }

    const item = rows[0];
    const ahorroReferencia = Math.round(
      (Number(item.recibo_anterior_usd) || 110.00) * ((Number(item.porcentaje_ahorro_estimado) || 70.00) / 100)
    );

    return {
      valido: true,
      codigoReferidoId: item.codigo_referido_id,
      codigo: item.codigo,
      familiaId: item.familia_id,
      nombreFamilia: item.nombre_familia,
      ahorroReferenciaMensualUsd: ahorroReferencia,
      porcentajeAhorroReferencia: Number(item.porcentaje_ahorro_estimado) || 70
    };
  }

  /**
   * Registra un evento de telemetría de referidos (tarjeta compartida, link copiado).
   */
  static async registrarEvento(tipoEvento, { familiaId = null, codigoReferido = null, metadata = {} } = {}) {
    const tiposPermitidos = [
      'tarjeta_compartida',
      'enlace_copiado',
      'calculadora_usada',
      'solicitud_iniciada',
      'solicitud_enviada'
    ];

    if (!tiposPermitidos.includes(tipoEvento)) {
      return;
    }

    try {
      await query(
        `INSERT INTO eventos_growth (tipo_evento, familia_id, codigo_referido, metadata)
         VALUES (?, ?, ?, ?)`,
        [tipoEvento, familiaId, codigoReferido, JSON.stringify(metadata)]
      );
    } catch (_err) {
      // Telemetría no bloqueante si la base de datos está temporalmente inaccesible
    }
  }
}
