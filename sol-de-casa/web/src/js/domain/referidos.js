// Dominio puro · Parte 2 de Sol de Casa: Ciclo de Referidos, Calculadora del Vecino y Economía de Recompensas
;(function () {
  const CONFIG_REFERIDOS_BASE = {
    // Datos explícitos del enunciado Parte 2
    reciboEjemplo: 110, // USD/mes antes de paneles
    porcentajeAhorro: 0.7, // 70% de ahorro ($77/mes en recibo de $110)
    mesesInstaladoEjemplo: 8, // Meses transcurridos para ejemplo acumulado (simulado)
    precioInstalacion: 6500, // USD instalación estándar Sol de Casa
    topeCacReferido: 300, // Máximo permitido por venta referida (incluyendo visitas)
    costoVisita: 60, // USD por visita técnica realizada
    tasaCierreReferidos: 0.45, // 45% de cierre sobre visitas realizadas de referidos

    // Estructura de premios propuesta dentro del presupuesto disponible ($166,67)
    premioReferidor: 100, // USD acreditados a la familia que refiere (solo al firmar contrato)
    premioVecino: 60, // USD de descuento directo / monitoreo al vecino referido (al firmar contrato)
  }

  const FAMILIA_DEMO = {
    id: 'familia-gomez',
    nombre: 'Familia Gómez',
    colonia: 'Col. Jardines del Sol',
    enlaceBase: 'https://soldecasa.com/vecino?ref=familia-gomez',
    codigo: 'GOMEZ-77',
    simulado: true,
  }

  // Estado inicial simulado de vecinos invitados para demostración inmediata
  const REFERIDOS_INICIALES = [
    {
      id: 'ref-101',
      nombre: 'Laura Paredes',
      zona: 'A 2 cuadras · Recibo $130/mes',
      etapa: 4, // 1: Solicitud, 2: Visita realizada, 3: Propuesta en revisión, 4: Contrato firmado
      fecha: 'Hace 18 días',
      simulado: true,
      premioEstado: 'Liberado: $100 para ti · $60 dto. vecino',
    },
    {
      id: 'ref-102',
      nombre: 'Roberto Villalobos',
      zona: 'Misma calle · Recibo $145/mes',
      etapa: 2,
      fecha: 'Hace 6 días',
      simulado: true,
      premioEstado: 'Visita hecha · Se activa al firmar ($100)',
    },
    {
      id: 'ref-103',
      nombre: 'Elena Ríos',
      zona: 'Col. vecina · Recibo $98/mes',
      etapa: 1,
      fecha: 'Ayer',
      simulado: true,
      premioEstado: 'Por confirmar cupo de cuadrilla',
    },
  ]

  // Métricas base simuladas del Panel de Andrés (coherentes con 45% de cierre: 9 ventas / 20 visitas = 45,0%)
  const TELEMETRIA_BASE = {
    tarjetasCompartidas: 68,
    usoCalculadora: 49,
    solicitudesVisita: 24,
    visitasRealizadas: 20,
    ventasFirmadas: 9,
    simulado: true,
  }

  function calcularAhorroFamilia(reciboAnterior = 110, pctAhorro = 0.7, meses = 8) {
    const recibo = Math.max(0, Number(reciboAnterior) || 0)
    const pct = Math.min(0.95, Math.max(0.1, Number(pctAhorro) || 0.7))
    const ahorroMensual = recibo * pct
    const reciboNuevo = recibo - ahorroMensual
    const ahorroAcumulado = ahorroMensual * Math.max(1, Math.round(meses))
    const kwhMesEvitados = Math.round(ahorroMensual * 5.2) // referencia orientativa residencial
    return {
      reciboAnterior: recibo,
      porcentajeAhorro: pct,
      ahorroMensual,
      reciboNuevo,
      mesesInstalado: Math.max(1, Math.round(meses)),
      ahorroAcumulado,
      kwhMesEvitados,
    }
  }

  function calcularAhorroVecino({ reciboMensual = 120, pctAhorro = 0.7, precioInstalacion = 6500, bonoVecino = 60 } = {}) {
    const recibo = Math.max(20, Number(reciboMensual) || 0)
    const ahorroMensual = recibo * pctAhorro
    const reciboRestante = recibo - ahorroMensual
    const ahorroAnual = ahorroMensual * 12
    const aniosRecuperacion = ahorroAnual > 0 ? precioInstalacion / ahorroAnual : null
    const inversionConBono = Math.max(0, precioInstalacion - bonoVecino)
    const aniosConBono = ahorroAnual > 0 ? inversionConBono / ahorroAnual : null
    const ahorro20Anios = ahorroAnual * 20 - precioInstalacion
    return {
      reciboMensual: recibo,
      pctAhorro,
      precioInstalacion,
      bonoVecino,
      ahorroMensual,
      reciboRestante,
      ahorroAnual,
      aniosRecuperacion,
      inversionConBono,
      aniosConBono,
      ahorro20Anios,
    }
  }

  // Cálculo riguroso del presupuesto disponible para premios respetando el tope de $300/venta
  function calcularPresupuestoRecompensas(cfg = {}) {
    const topeCac = cfg.topeCacReferido ?? CONFIG_REFERIDOS_BASE.topeCacReferido
    const costoVisita = cfg.costoVisita ?? CONFIG_REFERIDOS_BASE.costoVisita
    const tasaCierre = cfg.tasaCierreReferidos ?? CONFIG_REFERIDOS_BASE.tasaCierreReferidos
    const premioReferidor = cfg.premioReferidor ?? CONFIG_REFERIDOS_BASE.premioReferidor
    const premioVecino = cfg.premioVecino ?? CONFIG_REFERIDOS_BASE.premioVecino
    const contribucionBase = cfg.contribucionBase ?? 1625 // $6.500 * (1 - 0.55 - 0.17 - 0.03)

    const visitasPorVenta = tasaCierre > 0 ? 1 / tasaCierre : Infinity
    const costoVisitasPorVenta = visitasPorVenta * costoVisita
    const presupuestoDisponible = topeCac - costoVisitasPorVenta
    const premiosTotales = premioReferidor + premioVecino
    const holguraPresupuesto = presupuestoDisponible - premiosTotales
    const cacTotalReferido = costoVisitasPorVenta + premiosTotales
    const cumpleTope = cacTotalReferido <= topeCac + 1e-6 && premiosTotales <= presupuestoDisponible + 1e-6
    const ltvCacReferido = cacTotalReferido > 0 ? contribucionBase / cacTotalReferido : null
    const valorNetoPorVisita = contribucionBase * tasaCierre - costoVisita - premiosTotales * tasaCierre

    return {
      topeCac,
      costoVisita,
      tasaCierre,
      visitasPorVenta,
      costoVisitasPorVenta,
      presupuestoDisponible,
      premioReferidor,
      premioVecino,
      premiosTotales,
      holguraPresupuesto,
      cacTotalReferido,
      cumpleTope,
      ltvCacReferido,
      valorNetoPorVisita,
    }
  }

  function infoEtapaReferido(etapa) {
    const mapa = {
      1: { paso: 1, porcentaje: 25, titulo: 'Solicitud recibida', color: '#D98A2B', detalle: 'Validando cobertura y cupo real de técnicos' },
      2: { paso: 2, porcentaje: 55, titulo: 'Visita técnica realizada', color: '#2F6F73', detalle: 'Techo evaluado ($60 invertidos por Sol de Casa)' },
      3: { paso: 3, porcentaje: 80, titulo: 'Propuesta entregada', color: '#2F6F73', detalle: 'Cotización personalizada de $6.500 en revisión' },
      4: { paso: 4, porcentaje: 100, titulo: 'Contrato firmado', color: '#1D6B52', detalle: 'Anticipo 50% recibido · ¡Recompensa acreditada!' },
    }
    return mapa[etapa] || mapa[1]
  }

  const exported = {
    CONFIG_REFERIDOS_BASE,
    FAMILIA_DEMO,
    REFERIDOS_INICIALES,
    TELEMETRIA_BASE,
    calcularAhorroFamilia,
    calcularAhorroVecino,
    calcularPresupuestoRecompensas,
    infoEtapaReferido,
  }

  if (typeof window !== 'undefined') {
    window.SolReferidos = exported
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported
  }
})()

