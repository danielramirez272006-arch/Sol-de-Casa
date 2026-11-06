import { query, withTransaction } from '../config/db.js';
import { validarPeriodo, validarNumeroPositivo } from '../validators/schemas.js';

export class AhorroService {
  /**
   * Obtiene el resumen de ahorro mensual y acumulado de una familia.
   * Evita duplicar el mismo mes y rotula claramente los datos simulados o estimados.
   */
  static async obtenerResumenFamilia(familiaId) {
    const familias = await query(
      `SELECT id, nombre_familia, titular_nombre, direccion, fecha_instalacion,
              capacidad_kw, recibo_anterior_usd, porcentaje_ahorro_estimado, estado_integracion_inversor
       FROM familias 
       WHERE id = ?`,
      [familiaId]
    );

    if (familias.length === 0) {
      throw new Error('Familia no encontrada.');
    }

    const fam = familias[0];

    // Registros mensuales ordenados cronológicamente
    const registros = await query(
      `SELECT id, periodo, ahorro_usd, recibo_red_usd, generacion_kwh,
              tipo_registro, notas, creado_en, actualizado_en
       FROM ahorros_mensuales
       WHERE familia_id = ?
       ORDER BY periodo ASC`,
      [familiaId]
    );

    // Calcular ahorro acumulado
    let ahorroAcumulado = 0;
    let ahorroSimuladoTotal = 0;
    let ahorroRealTotal = 0;
    let tieneSimulados = false;
    let tieneReales = false;

    const desglose = registros.map((r) => {
      const monto = Number(r.ahorro_usd) || 0;
      ahorroAcumulado += monto;

      if (r.tipo_registro === 'simulado') {
        ahorroSimuladoTotal += monto;
        tieneSimulados = true;
      } else {
        ahorroRealTotal += monto;
        tieneReales = true;
      }

      return {
        id: r.id,
        periodo: r.periodo,
        ahorroMensualUsd: monto,
        reciboRedUsd: r.recibo_red_usd !== null ? Number(r.recibo_red_usd) : null,
        generacionKwh: r.generacion_kwh !== null ? Number(r.generacion_kwh) : null,
        tipoRegistro: r.tipo_registro,
        esSimulado: r.tipo_registro === 'simulado',
        notas: r.notas,
        actualizadoEn: r.actualizado_en
      };
    });

    const ultimoRegistro = desglose.length > 0 ? desglose[desglose.length - 1] : null;
    const ahorroUltimoMes = ultimoRegistro ? ultimoRegistro.ahorroMensualUsd : 0;
    const tipoUltimoMes = ultimoRegistro ? ultimoRegistro.tipoRegistro : 'sin_datos';

    // Estado de la integración con la plataforma del fabricante
    const integracionFabricante = {
      estado: fam.estado_integracion_inversor || 'pendiente_credenciales_api',
      nombrePlataforma: 'Portal Fabricante Inversores Solares',
      descripcion: 'La integración con la plataforma del fabricante queda identificada como pendiente hasta disponer de su API y credenciales de acceso oficial.',
      conectado: false
    };

    return {
      familiaId: fam.id,
      nombreFamilia: fam.nombre_familia,
      titularNombre: fam.titular_nombre,
      fechaInstalacion: fam.fecha_instalacion,
      capacidadKw: fam.capacidad_kw !== null ? Number(fam.capacidad_kw) : null,
      reciboAnteriorUsd: Number(fam.recibo_anterior_usd) || 110.00,
      porcentajeAhorroEstimado: Number(fam.porcentaje_ahorro_estimado) || 70.00,
      ahorroUltimoMesUsd: ahorroUltimoMes,
      tipoUltimoMes,
      esUltimoMesSimulado: tipoUltimoMes === 'simulado',
      ahorroAcumuladoUsd: Math.round(ahorroAcumulado * 100) / 100,
      desgloseTotales: {
        ahorroRealTotalUsd: Math.round(ahorroRealTotal * 100) / 100,
        ahorroSimuladoTotalUsd: Math.round(ahorroSimuladoTotal * 100) / 100,
        tieneSimulados,
        tieneReales
      },
      etiqueta: tieneSimulados && !tieneReales ? 'Simulado' : tieneSimulados ? 'Parcialmente simulado' : 'Real',
      totalMesesRegistrados: desglose.length,
      meses: desglose,
      integracionFabricante
    };
  }

  /**
   * Carga o corrige un registro mensual de ahorro (exclusivo del administrador).
   * Usa ON DUPLICATE KEY UPDATE sobre `uq_familia_periodo` para garantizar unicidad por mes.
   */
  static async guardarRegistroMensual({
    familiaId,
    periodo,
    ahorroUsd,
    reciboRedUsd = null,
    generacionKwh = null,
    tipoRegistro = 'real',
    notas = null,
    adminUsuarioId = null
  }) {
    if (!validarPeriodo(periodo)) {
      throw new Error('El formato del período debe ser YYYY-MM (ejemplo: 2026-04).');
    }
    if (!validarNumeroPositivo(ahorroUsd, true)) {
      throw new Error('El monto de ahorro mensual debe ser un número igual o mayor a cero.');
    }
    if (!['real', 'estimado', 'simulado'].includes(tipoRegistro)) {
      throw new Error('El tipo de registro debe ser "real", "estimado" o "simulado".');
    }

    // Verificar existencia de la familia
    const familias = await query('SELECT id, nombre_familia FROM familias WHERE id = ?', [familiaId]);
    if (familias.length === 0) {
      throw new Error('Familia no encontrada.');
    }

    return await withTransaction(async (conn) => {
      // Upsert para no duplicar el mes
      await conn.query(
        `INSERT INTO ahorros_mensuales (
          familia_id, periodo, ahorro_usd, recibo_red_usd, generacion_kwh, tipo_registro, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          ahorro_usd = VALUES(ahorro_usd),
          recibo_red_usd = VALUES(recibo_red_usd),
          generacion_kwh = VALUES(generacion_kwh),
          tipo_registro = VALUES(tipo_registro),
          notas = VALUES(notas),
          actualizado_en = CURRENT_TIMESTAMP`,
        [familiaId, periodo, ahorroUsd, reciboRedUsd, generacionKwh, tipoRegistro, notas]
      );

      // Registrar en log de auditoría
      if (adminUsuarioId) {
        await conn.query(
          `INSERT INTO logs_auditoria (usuario_id, accion, entidad, entidad_id, detalles)
           VALUES (?, 'guardar_ahorro_mensual', 'ahorros_mensuales', ?, ?)`,
          [
            adminUsuarioId,
            familiaId,
            JSON.stringify({ periodo, ahorroUsd, tipoRegistro, notas })
          ]
        );
      }

      return {
        ok: true,
        familiaId,
        periodo,
        ahorroUsd: Number(ahorroUsd),
        tipoRegistro,
        mensaje: `Registro mensual para ${periodo} guardado exitosamente.`
      };
    });
  }

  /**
   * Elimina un registro mensual de ahorro (exclusivo de administrador).
   */
  static async eliminarRegistroMensual(familiaId, periodo, adminUsuarioId = null) {
    if (!validarPeriodo(periodo)) {
      throw new Error('Formato de período inválido.');
    }

    await query('DELETE FROM ahorros_mensuales WHERE familia_id = ? AND periodo = ?', [familiaId, periodo]);

    if (adminUsuarioId) {
      await query(
        `INSERT INTO logs_auditoria (usuario_id, accion, entidad, entidad_id, detalles)
         VALUES (?, 'eliminar_ahorro_mensual', 'ahorros_mensuales', ?, ?)`,
        [adminUsuarioId, familiaId, JSON.stringify({ periodo })]
      );
    }

    return { ok: true, mensaje: `Registro del período ${periodo} eliminado.` };
  }
}

