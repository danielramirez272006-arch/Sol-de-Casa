import { query } from '../config/db.js';
import { env } from '../config/env.js';

export class DashboardService {
  /**
   * Genera el resumen consolidado para el Panel de Andrés.
   * Separa explícitamente datos reales de demostraciones simuladas,
   * calcula demanda vs capacidad disponible y muestra la economía del programa.
   */
  static async obtenerResumenAndres({ tecnicosAdicionales = 0 } = {}) {
    // 1. Capacidad técnica mensual
    const capacidadBase = env.solar.baseMonthlyCapacity; // 100
    const capacidadPorTecnico = env.solar.capacityPerTechnician; // 50
    const capacidadTotal = capacidadBase + (tecnicosAdicionales * capacidadPorTecnico);

    // 2. Conteo de eventos de growth (tarjetas compartidas, calculadora)
    const [eventos] = await query(`
      SELECT 
        SUM(CASE WHEN tipo_evento = 'tarjeta_compartida' THEN 1 ELSE 0 END) AS tarjetas_compartidas,
        SUM(CASE WHEN tipo_evento = 'enlace_copiado' THEN 1 ELSE 0 END) AS enlaces_copiados,
        SUM(CASE WHEN tipo_evento = 'calculadora_usada' THEN 1 ELSE 0 END) AS usos_calculadora
      FROM eventos_growth
    `);

    // 3. Conteo de solicitudes por estado y distinción real vs simulada
    const [solicitudesStats] = await query(`
      SELECT 
        COUNT(*) AS total_solicitudes,
        SUM(CASE WHEN es_simulada = TRUE THEN 1 ELSE 0 END) AS solicitudes_simuladas,
        SUM(CASE WHEN es_simulada = FALSE THEN 1 ELSE 0 END) AS solicitudes_reales,
        SUM(CASE WHEN estado = 'solicitada' THEN 1 ELSE 0 END) AS estado_solicitada,
        SUM(CASE WHEN estado = 'agendada' THEN 1 ELSE 0 END) AS estado_agendada,
        SUM(CASE WHEN estado = 'realizada' THEN 1 ELSE 0 END) AS estado_realizada,
        SUM(CASE WHEN estado = 'venta_confirmada' THEN 1 ELSE 0 END) AS estado_venta_confirmada,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS estado_cancelada
      FROM solicitudes_visita
    `);

    // 4. Conteo de visitas (demanda sobre capacidad mensual)
    const [visitasStats] = await query(`
      SELECT 
        COUNT(*) AS total_visitas_programadas,
        SUM(CASE WHEN estado = 'realizada' THEN 1 ELSE 0 END) AS visitas_realizadas,
        SUM(CASE WHEN s.es_simulada = TRUE THEN 1 ELSE 0 END) AS visitas_simuladas,
        SUM(CASE WHEN s.es_simulada = FALSE THEN 1 ELSE 0 END) AS visitas_reales,
        COALESCE(SUM(v.costo_visita_usd), 0) AS costo_acumulado_visitas
      FROM visitas v
      INNER JOIN solicitudes_visita s ON s.id = v.solicitud_id
    `);

    // 5. Conteo de ventas confirmadas y recompensas
    const [ventasStats] = await query(`
      SELECT 
        COUNT(vt.id) AS ventas_confirmadas,
        COALESCE(SUM(vt.monto_total_usd), 0) AS volumen_ventas_usd,
        SUM(CASE WHEN s.es_simulada = TRUE THEN 1 ELSE 0 END) AS ventas_simuladas,
        SUM(CASE WHEN s.es_simulada = FALSE THEN 1 ELSE 0 END) AS ventas_reales
      FROM ventas vt
      INNER JOIN solicitudes_visita s ON s.id = vt.solicitud_id
    `);

    const [recompensasStats] = await query(`
      SELECT 
        COUNT(*) AS total_recompensas,
        SUM(CASE WHEN estado = 'ganada' THEN 1 ELSE 0 END) AS recompensas_ganadas,
        SUM(CASE WHEN estado = 'entregada' THEN 1 ELSE 0 END) AS recompensas_entregadas,
        COALESCE(SUM(costo_empresa_usd), 0) AS costo_acumulado_recompensas_usd,
        COALESCE(SUM(valor_percibido_usd), 0) AS valor_percibido_acumulado_usd
      FROM recompensas
    `);

    // 6. Demanda actual y saturación de capacidad
    const visitasRealizadas = Number(visitasStats[0].visitas_realizadas) || 0;
    const visitasProgramadas = Number(visitasStats[0].total_visitas_programadas) || 0;
    const demandaMes = visitasProgramadas;
    const capacidadDisponible = Math.max(0, capacidadTotal - demandaMes);
    const porcentajeOcupacion = capacidadTotal > 0 ? Math.round((demandaMes / capacidadTotal) * 100) : 0;

    // 7. Costo real observado vs esperado
    const ventasConfirmadas = Number(ventasStats[0].ventas_confirmadas) || 0;
    const costoVisitas = Number(visitasStats[0].costo_acumulado_visitas) || 0;
    const costoRecompensas = Number(recompensasStats[0].costo_acumulado_recompensas_usd) || 0;
    const costoTotalPrograma = costoVisitas + costoRecompensas;
    const cacRealObservado = ventasConfirmadas > 0 ? Math.round((costoTotalPrograma / ventasConfirmadas) * 100) / 100 : 0;

    // Conversión de 50 visitas por técnico a ventas y familias que comparten
    // Cierre referidos: 45% -> 50 visitas x 0.45 = 22.5 ventas
    // En el caso, las ventas se convierten en nuevas familias instaladas
    const ventasPorTecnico = Math.round(50 * env.solar.closingRateReferrals * 10) / 10; // 22.5

    return {
      capacidad: {
        capacidadBase,
        capacidadPorTecnico,
        tecnicosAdicionales,
        capacidadTotalMes: capacidadTotal,
        demandaVisitasMes: demandaMes,
        capacidadDisponible,
        porcentajeOcupacion,
        saturada: demandaMes >= capacidadTotal,
        analisisTecnicoAdicional: {
          visitasAportadas: 50,
          ventasEsperadas: ventasPorTecnico,
          tasaCierre: '45%'
        }
      },
      embudoReferidos: {
        tarjetasCompartidas: Number(eventos[0].tarjetas_compartidas) || 0,
        enlacesCopiados: Number(eventos[0].enlaces_copiados) || 0,
        usosCalculadora: Number(eventos[0].usos_calculadora) || 0,
        solicitudesRecibidas: Number(solicitudesStats[0].total_solicitudes) || 0,
        visitasRealizadas,
        ventasConfirmadas
      },
      distincionSimuladoReal: {
        totalSolicitudes: Number(solicitudesStats[0].total_solicitudes) || 0,
        solicitudesSimuladas: Number(solicitudesStats[0].solicitudes_simuladas) || 0,
        solicitudesReales: Number(solicitudesStats[0].solicitudes_reales) || 0,
        ventasSimuladas: Number(ventasStats[0].ventas_simuladas) || 0,
        ventasReales: Number(ventasStats[0].ventas_reales) || 0,
        etiquetaPredominante: Number(solicitudesStats[0].solicitudes_reales) > 0 ? 'Híbrido (Real + Simulado)' : 'Simulado'
      },
      recompensas: {
        totalAsignadas: Number(recompensasStats[0].total_recompensas) || 0,
        ganadas: Number(recompensasStats[0].recompensas_ganadas) || 0,
        entregadas: Number(recompensasStats[0].recompensas_entregadas) || 0,
        costoEmpresaAcumuladoUsd: costoRecompensas,
        valorPercibidoAcumuladoUsd: Number(recompensasStats[0].valor_percibido_acumulado_usd) || 0
      },
      economiaPrograma: {
        costoVisitasTotalUsd: costoVisitas,
        costoRecompensasTotalUsd: costoRecompensas,
        costoTotalProgramaUsd: costoTotalPrograma,
        cacRealObservadoUsd: cacRealObservado,
        cacEsperadoTeoricoUsd: 193.33,
        limiteMaximoCacUsd: 300.00,
        respetaLimiteMaximo: cacRealObservado <= 300.00
      }
    };
  }
}

