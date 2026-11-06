import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';

export class RecompensasService {
  /**
   * Confirma la venta de una solicitud y crea atómicamente la recompensa para la familia referidora.
   * Ambas operaciones ocurren dentro de una única transacción MySQL.
   * La restricción de clave única (UNIQUE KEY `venta_id` en `recompensas`) previene duplicados concurrentes.
   */
  static async confirmarVentaYGenerarRecompensa({
    solicitudId,
    montoTotalUsd = env.solar.standardInstallationPrice,
    costoEmpresaRecompensa = env.solar.rewardCleaningCost,
    valorPercibidoRecompensa = 100.00,
    tipoRecompensa = 'limpieza_paneles',
    descripcionRecompensa = 'Limpieza y mantenimiento preventivo anual de paneles solares',
    adminUsuarioId = null
  }) {
    return await withTransaction(async (conn) => {
      // 1. Obtener solicitud con bloqueo FOR UPDATE para control de concurrencia
      const [solicitudes] = await conn.query(
        `SELECT id, estado, familia_referidora_id, nombre_vecino 
         FROM solicitudes_visita 
         WHERE id = ? FOR UPDATE`,
        [solicitudId]
      );

      if (solicitudes.length === 0) {
        throw new Error('Solicitud no encontrada.');
      }

      const sol = solicitudes[0];

      if (sol.estado === 'cancelada') {
        throw new Error('No se puede confirmar una venta sobre una solicitud cancelada.');
      }

      // 2. Obtener o crear registro de visita realizada
      let visitaId;
      const [visitas] = await conn.query('SELECT id, estado FROM visitas WHERE solicitud_id = ?', [solicitudId]);
      if (visitas.length === 0) {
        const [resVis] = await conn.query(
          `INSERT INTO visitas (solicitud_id, fecha_programada, estado, resultado_visita, costo_visita_usd)
           VALUES (?, NOW(), 'realizada', 'interesado', ?)`,
          [solicitudId, env.solar.visitCost]
        );
        visitaId = resVis.insertId;
      } else {
        visitaId = visitas[0].id;
        await conn.query(
          `UPDATE visitas SET estado = 'realizada', resultado_visita = 'interesado' WHERE id = ?`,
          [visitaId]
        );
      }

      // 3. Crear o recuperar la venta (con prevención de duplicados)
      const [ventasPrevias] = await conn.query('SELECT id FROM ventas WHERE solicitud_id = ?', [solicitudId]);
      let ventaId;

      if (ventasPrevias.length > 0) {
        ventaId = ventasPrevias[0].id;
      } else {
        const [resVenta] = await conn.query(
          `INSERT INTO ventas (solicitud_id, visita_id, monto_total_usd, estado_pago)
           VALUES (?, ?, ?, 'anticipo_pagado')`,
          [solicitudId, visitaId, montoTotalUsd]
        );
        ventaId = resVenta.insertId;
      }

      // 4. Actualizar estado de la solicitud a 'venta_confirmada'
      await conn.query(
        `UPDATE solicitudes_visita SET estado = 'venta_confirmada', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
        [solicitudId]
      );

      // 5. Crear la recompensa si la solicitud tiene una familia referidora
      let recompensaId = null;
      let recompensaCreada = false;

      if (sol.familia_referidora_id) {
        // Verificar si ya existe una recompensa para esta venta específica
        const [recompExist] = await conn.query('SELECT id, estado FROM recompensas WHERE venta_id = ?', [ventaId]);

        if (recompExist.length > 0) {
          recompensaId = recompExist[0].id;
          recompensaCreada = false;
        } else {
          // INSERT atómico (la restricción UNIQUE KEY sobre venta_id impide cualquier carrera)
          const [resRecomp] = await conn.query(
            `INSERT INTO recompensas (
              familia_beneficiaria_id, venta_id, tipo_recompensa, descripcion,
              valor_percibido_usd, costo_empresa_usd, estado
            ) VALUES (?, ?, ?, ?, ?, ?, 'ganada')`,
            [
              sol.familia_referidora_id,
              ventaId,
              tipoRecompensa,
              descripcionRecompensa,
              valorPercibidoRecompensa,
              costoEmpresaRecompensa
            ]
          );
          recompensaId = resRecomp.insertId;
          recompensaCreada = true;
        }
      }

      // 6. Auditoría
      if (adminUsuarioId) {
        await conn.query(
          `INSERT INTO logs_auditoria (usuario_id, accion, entidad, entidad_id, detalles)
           VALUES (?, 'confirmar_venta_recompensa', 'ventas', ?, ?)`,
          [adminUsuarioId, ventaId, JSON.stringify({ solicitudId, recompensaId, montoTotalUsd })]
        );
      }

      // 7. Evaluación de la economía del caso
      const analisis = RecompensasService.evaluarEconomiaReferidos({
        costoVisita: env.solar.visitCost,
        tasaCierreVisitas: env.solar.closingRateReferrals,
        costoLimpieza: costoEmpresaRecompensa,
        maximoPresupuestoCac: env.solar.maxReferralCac
      });

      return {
        ok: true,
        solicitudId,
        ventaId,
        recompensaId,
        recompensaCreada,
        familiaReferidoraId: sol.familia_referidora_id,
        nombreVecino: sol.nombre_vecino,
        analisisEconomico: analisis,
        mensaje: recompensaCreada 
          ? 'Venta confirmada exitosamente y recompensa asignada a la familia que refirió.'
          : 'Venta confirmada exitosamente.'
      };
    });
  }

  /**
   * Actualiza el estado de una recompensa (ej: ganada -> entregada).
   */
  static async actualizarEstadoRecompensa(recompensaId, nuevoEstado, { notas = null, adminUsuarioId = null } = {}) {
    const estadosValidos = ['pendiente', 'ganada', 'entregada', 'cancelada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado de recompensa inválido: ${nuevoEstado}`);
    }

    const recomp = await query('SELECT id, estado, familia_beneficiaria_id FROM recompensas WHERE id = ?', [recompensaId]);
    if (recomp.length === 0) {
      throw new Error('Recompensa no encontrada.');
    }

    const estadoAnterior = recomp[0].estado;
    const fechaEntregada = nuevoEstado === 'entregada' ? new Date() : null;

    await query(
      `UPDATE recompensas 
       SET estado = ?, 
           fecha_entregada = COALESCE(?, fecha_entregada),
           notas = COALESCE(?, notas),
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nuevoEstado, fechaEntregada, notas, recompensaId]
    );

    if (adminUsuarioId) {
      await query(
        `INSERT INTO logs_auditoria (usuario_id, accion, entidad, entidad_id, detalles)
         VALUES (?, 'cambio_estado_recompensa', 'recompensas', ?, ?)`,
        [adminUsuarioId, recompensaId, JSON.stringify({ anterior: estadoAnterior, nuevo: nuevoEstado, notas })]
      );
    }

    return {
      ok: true,
      recompensaId,
      estadoAnterior,
      nuevoEstado,
      mensaje: `Recompensa actualizada a "${nuevoEstado}".`
    };
  }

  /**
   * Evalúa la economía unitaria del canal referidos según las fórmulas del Caso C.
   * Costo esperado de visitas por venta = $60 ÷ 0,45 = $133,33
   * Costo esperado con una limpieza = $133,33 + $60 = $193,33
   * Respeta el tope de $300 por venta referida.
   */
  static evaluarEconomiaReferidos({
    costoVisita = 60.00,
    tasaCierreVisitas = 0.45,
    costoLimpieza = 60.00,
    maximoPresupuestoCac = 300.00
  } = {}) {
    // 1. Visitas promedio necesarias para cerrar 1 venta: 1 / 0.45 = 2.22
    const visitasPorVenta = Math.round((1 / tasaCierreVisitas) * 100) / 100;
    
    // 2. Costo esperado de visitas por venta: $60 / 0.45 = $133.33
    const costoEsperadoVisitas = Math.round((costoVisita / tasaCierreVisitas) * 100) / 100;

    // 3. Costo esperado total con recompensa de limpieza: $133.33 + $60 = $193.33
    const costoEsperadoTotal = Math.round((costoEsperadoVisitas + costoLimpieza) * 100) / 100;

    // 4. Margen de holgura respecto al límite de $300
    const margenBajoLimite = Math.round((maximoPresupuestoCac - costoEsperadoTotal) * 100) / 100;
    const respetaLimite = costoEsperadoTotal <= maximoPresupuestoCac;

    return {
      costoVisitaUsd: costoVisita,
      tasaCierreVisitasReferidos: tasaCierreVisitas,
      visitasPorVentaEsperadas: visitasPorVenta,
      costoEsperadoVisitasUsd: costoEsperadoVisitas,
      costoRecompensaLimpiezaUsd: costoLimpieza,
      costoEsperadoTotalPorVentaUsd: costoEsperadoTotal,
      limiteMaximoCacUsd: maximoPresupuestoCac,
      margenHolguraUsd: margenBajoLimite,
      respetaLimite,
      notaEconomica: 'El cálculo esperado asume una tasa de cierre promedio del 45 %. El costo real observado del programa debe calcularse a partir de las visitas totales realizadas (incluidas las que no cierran venta) divididas entre las ventas concretadas en el período, por lo que no debe presentarse como una garantía para cada cliente individual.'
    };
  }

  /**
   * Obtiene las recompensas ganadas por una familia.
   */
  static async obtenerRecompensasFamilia(familiaId) {
    const rows = await query(
      `SELECT r.id, r.tipo_recompensa, r.descripcion, r.valor_percibido_usd,
              r.costo_empresa_usd, r.estado, r.fecha_ganada, r.fecha_entregada,
              s.nombre_vecino, vt.monto_total_usd
       FROM recompensas r
       INNER JOIN ventas vt ON vt.id = r.venta_id
       INNER JOIN solicitudes_visita s ON s.id = vt.solicitud_id
       WHERE r.familia_beneficiaria_id = ?
       ORDER BY r.fecha_ganada DESC`,
      [familiaId]
    );

    return rows.map(r => ({
      id: r.id,
      tipo: r.tipo_recompensa,
      descripcion: r.descripcion,
      valorPercibidoUsd: Number(r.valor_percibido_usd),
      costoEmpresaUsd: Number(r.costo_empresa_usd),
      estado: r.estado,
      fechaGanada: r.fecha_ganada,
      fechaEntregada: r.fecha_entregada,
      nombreVecinoReferido: r.nombre_vecino
    }));
  }
}

