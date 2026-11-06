// Motor determinista completo de Sol de Casa (Niveles 1, 2 y 3 + conexión Excel)
;(function () {
  const SUPUESTOS_BASE = {
    precio: 6500,
    equipos: 0.55,
    instalacion: 0.17,
    comision: 0.03,
    costoVisita: 60,
    capacidad: 100,
    cplPrometido: 8,
    tecnicosExtra: 0,
    visitasPorTecnico: 50,
    costoTecnico: 1800,
    meta: { contacto: 0.55, agenda: 0.3, visita: 0.7, cierre: 0.18 },
    google: { contacto: 0.85, agenda: 0.55, visita: 0.85, cierre: 0.3 },
    filtro: { reduccionLeads: 0.2, contacto: 0.8, agenda: 0.4, visita: 0.75, cierre: 0.22 },
    bateria: { precio: 3000, margen: 0.2, comision: 0.03, adopcion: 0.15 },
    costosFijos: 18000,
    cajaInicial: 12000,
    pisoCaja: 5000,
    ventasMesAnterior: 22,
    curva: [
      { inv: 0, meta: 0, google: 0 },
      { inv: 2000, meta: 280, google: 55 },
      { inv: 4000, meta: 500, google: 100 },
      { inv: 6000, meta: 680, google: 135 },
      { inv: 8000, meta: 840, google: 160 },
      { inv: 10000, meta: 960, google: 160 },
    ],
  }

  const ESCENARIOS_BASE = [
    { id: 'actual', nombre: 'Actual', meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 },
    { id: 'agHist', nombre: 'Agencia: historial', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 0 },
    { id: 'agPromesa', nombre: 'Agencia: promesa', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 1 },
    { id: 'filtro', nombre: 'Solo filtro', meta: 4000, google: 4000, filtro: 1, bateria: 0, cplFijo: 0 },
    { id: 'propuesta', nombre: 'Filtro y batería', meta: 4000, google: 4000, filtro: 1, bateria: 1, cplFijo: 0 },
  ]

  const PLANES_INICIALES = [
    { id: 'p1', nombre: 'Actual ($4k/$4k fijo)', meta: 4000, google: 4000, escalaDesde: 0, metaFase2: 4000, googleFase2: 4000, filtroDesde: 0, tecnico1: 0, tecnico2: 0 },
    { id: 'p2', nombre: 'Agencia ($8k Meta / $0 Google)', meta: 8000, google: 0, escalaDesde: 0, metaFase2: 8000, googleFase2: 0, filtroDesde: 0, tecnico1: 0, tecnico2: 0 },
    { id: 'p3', nombre: 'Propio A: filtro + 1 técnico', meta: 4000, google: 6000, escalaDesde: 0, metaFase2: 4000, googleFase2: 6000, filtroDesde: 1, tecnico1: 1, tecnico2: 0 },
    { id: 'p4', nombre: 'Propio B: camino escala segura', meta: 4000, google: 4000, escalaDesde: 3, metaFase2: 7000, googleFase2: 6000, filtroDesde: 1, tecnico1: 1, tecnico2: 2 },
    { id: 'p5', nombre: 'Propio C: camino máx. caja', meta: 4000, google: 6000, escalaDesde: 3, metaFase2: 7000, googleFase2: 6000, filtroDesde: 1, tecnico1: 1, tecnico2: 2 },
  ]

  const TOPE_INVERSION = { meta: 10000, google: 8000 }
  const MESES = 24

  const clonar = (x) => JSON.parse(JSON.stringify(x))
  const dividir = (a, b) => (b ? a / b : null)
  const leerRuta = (obj, ruta) => ruta.split('.').reduce((o, k) => (o ? o[k] : undefined), obj)
  function asignarRuta(obj, ruta, valor) {
    const [k, ...resto] = ruta.split('.')
    return { ...obj, [k]: resto.length ? asignarRuta(obj[k], resto.join('.'), valor) : valor }
  }

  function conTecnicos(S) {
    const n = Math.min(2, Math.max(0, Math.round(S.tecnicosExtra || 0)))
    return {
      ...S,
      capacidad: S.capacidad + n * S.visitasPorTecnico,
      costosFijos: S.costosFijos + n * S.costoTecnico,
    }
  }

  function leadsPorInversion(inv, canal, curva) {
    if (inv < 0 || inv > TOPE_INVERSION[canal]) return 0
    let total = 0
    for (let i = 1; i < curva.length; i++) {
      const a = curva[i - 1]
      const b = curva[i]
      total += (Math.min(Math.max(inv - a.inv, 0), b.inv - a.inv) * (b[canal] - a[canal])) / (b.inv - a.inv)
    }
    return total
  }

  function calcularLeads(e, S) {
    const base = e.cplFijo ? e.meta / S.cplPrometido : leadsPorInversion(e.meta, 'meta', S.curva)
    return {
      meta: base * (1 - e.filtro * S.filtro.reduccionLeads),
      google: leadsPorInversion(e.google, 'google', S.curva),
    }
  }

  function analizarCaidas(pasos) {
    let mayorVolumen = null
    let mayorPorcentaje = null
    for (let i = 1; i < pasos.length; i++) {
      const prev = pasos[i - 1]
      const act = pasos[i]
      const perdidos = Math.max(0, prev.valor - act.valor)
      const pctCaida = prev.valor > 0 ? perdidos / prev.valor : 0
      const item = { etapa: `${prev.nombre} → ${act.nombre}`, destino: act.nombre, perdidos, pctCaida }
      if (!mayorVolumen || item.perdidos > mayorVolumen.perdidos) mayorVolumen = item
      if (!mayorPorcentaje || item.pctCaida > mayorPorcentaje.pctCaida) mayorPorcentaje = item
    }
    return { mayorVolumen, mayorPorcentaje }
  }

  function calcularEmbudo(e, S, leads) {
    const m = e.filtro ? S.filtro : S.meta
    const g = S.google

    const contactadosMeta = leads.meta * m.contacto
    const contactadosGoogle = leads.google * g.contacto
    const agendadasMeta = contactadosMeta * m.agenda
    const agendadasGoogle = contactadosGoogle * g.agenda
    const solMeta = agendadasMeta * m.visita
    const solGoogle = agendadasGoogle * g.visita
    const solicitadas = solMeta + solGoogle

    const hechasGoogle = Math.min(solGoogle, S.capacidad)
    const hechasMeta = Math.min(solMeta, Math.max(0, S.capacidad - hechasGoogle))
    const realizadas = hechasGoogle + hechasMeta

    const ventasMeta = hechasMeta * m.cierre
    const ventasGoogle = hechasGoogle * g.cierre

    const caidaMeta = analizarCaidas([
      { nombre: 'Leads', valor: leads.meta },
      { nombre: 'Contactados', valor: contactadosMeta },
      { nombre: 'Agendadas', valor: agendadasMeta },
      { nombre: 'Hechas', valor: hechasMeta },
      { nombre: 'Ventas', valor: ventasMeta },
    ])
    const caidaGoogle = analizarCaidas([
      { nombre: 'Leads', valor: leads.google },
      { nombre: 'Contactados', valor: contactadosGoogle },
      { nombre: 'Agendadas', valor: agendadasGoogle },
      { nombre: 'Hechas', valor: hechasGoogle },
      { nombre: 'Ventas', valor: ventasGoogle },
    ])

    return {
      leadsTotales: leads.meta + leads.google,
      contactadosMeta,
      contactadosGoogle,
      contactadosTotales: contactadosMeta + contactadosGoogle,
      agendadasMeta,
      agendadasGoogle,
      agendadasTotales: agendadasMeta + agendadasGoogle,
      solicitadasMeta: solMeta,
      solicitadasGoogle: solGoogle,
      solicitadas,
      realizadas,
      perdidas: Math.max(0, solicitadas - realizadas),
      hechasMeta,
      hechasGoogle,
      ventasMeta,
      ventasGoogle,
      cierreMeta: m.cierre,
      cierreGoogle: g.cierre,
      ventas: ventasMeta + ventasGoogle,
      usoCapacidad: S.capacidad > 0 ? realizadas / S.capacidad : 0,
      caidaMeta,
      caidaGoogle,
    }
  }

  function mesRecuperacion(firma, siguiente) {
    if (firma == null) return null
    if (firma >= 0) return 'Mes 1 (firma)'
    if (siguiente >= 0) return 'Mes 2 (instalación)'
    return 'Más de 2 meses'
  }

  function calcularFinanzas(e, S, leads, embudo) {
    const margenBruto = 1 - S.equipos - S.instalacion
    const contrInstalacion = S.precio * (margenBruto - S.comision)
    const aporteBateria = e.bateria ? S.bateria.precio * (S.bateria.margen - S.bateria.comision) * S.bateria.adopcion : 0
    const contribPorVenta = contrInstalacion + aporteBateria

    const contribucion = embudo.ventas * contribPorVenta
    const anuncios = e.meta + e.google
    const costoVisitas = embudo.realizadas * S.costoVisita
    const despuesMarketing = contribucion - anuncios - costoVisitas

    const cacRealMeta = dividir(e.meta + embudo.hechasMeta * S.costoVisita, embudo.ventasMeta)
    const cacRealGoogle = dividir(e.google + embudo.hechasGoogle * S.costoVisita, embudo.ventasGoogle)
    const cacCombinado = dividir(anuncios + costoVisitas, embudo.ventas)

    const cajaFirma = S.precio * (0.5 - S.equipos - S.comision)
    const cajaSiguiente = S.precio * (0.5 - S.instalacion)
    const paybackFirma = (cac) => (cac == null ? null : -cac + cajaFirma)
    const paybackSig = (cac) => (cac == null ? null : paybackFirma(cac) + cajaSiguiente)

    const paybackMetaFirma = paybackFirma(cacRealMeta)
    const paybackMetaSiguiente = paybackSig(cacRealMeta)
    const paybackGoogleFirma = paybackFirma(cacRealGoogle)
    const paybackGoogleSiguiente = paybackSig(cacRealGoogle)

    const cajaFinalMes1 =
      S.cajaInicial +
      S.precio * 0.5 * (S.ventasMesAnterior + embudo.ventas) -
      S.precio * (S.equipos + S.comision) * embudo.ventas -
      S.precio * S.instalacion * S.ventasMesAnterior -
      anuncios -
      costoVisitas -
      S.costosFijos

    const valorVisitaMeta = embudo.cierreMeta * contribPorVenta - S.costoVisita
    const valorVisitaGoogle = embudo.cierreGoogle * contribPorVenta - S.costoVisita
    const valorVisitaCombinado =
      embudo.realizadas > 0
        ? (embudo.hechasMeta * valorVisitaMeta + embudo.hechasGoogle * valorVisitaGoogle) / embudo.realizadas
        : null

    return {
      margenBruto,
      contrInstalacion,
      aporteBateria,
      contribPorVenta,
      contribucion,
      anuncios,
      costoVisitas,
      despuesMarketing,
      neto: despuesMarketing - S.costosFijos,
      cplMeta: dividir(e.meta, leads.meta),
      cplGoogle: dividir(e.google, leads.google),
      cplCombinado: dividir(anuncios, embudo.leadsTotales),
      cacAnunciosMeta: dividir(e.meta, embudo.ventasMeta),
      cacAnunciosGoogle: dividir(e.google, embudo.ventasGoogle),
      cacAnunciosCombinado: dividir(anuncios, embudo.ventas),
      cacRealMeta,
      cacRealGoogle,
      cacCombinado,
      ltvCacMeta: dividir(contribPorVenta, cacRealMeta),
      ltvCacGoogle: dividir(contribPorVenta, cacRealGoogle),
      ltvCacCombinado: dividir(contribPorVenta, cacCombinado),
      visitasPorVentaMeta: dividir(embudo.hechasMeta, embudo.ventasMeta),
      visitasPorVentaGoogle: dividir(embudo.hechasGoogle, embudo.ventasGoogle),
      visitasPorVentaCombinado: dividir(embudo.realizadas, embudo.ventas),
      valorVisitaMeta,
      valorVisitaGoogle,
      valorVisitaCombinado,
      paybackMetaFirma,
      paybackMetaSiguiente,
      paybackMesMeta: mesRecuperacion(paybackMetaFirma, paybackMetaSiguiente),
      paybackGoogleFirma,
      paybackGoogleSiguiente,
      paybackMesGoogle: mesRecuperacion(paybackGoogleFirma, paybackGoogleSiguiente),
      cajaFinalMes1,
      sobrePisoCaja: cajaFinalMes1 >= S.pisoCaja,
    }
  }

  function calcular(escenario, supuestosBase) {
    const supuestos = conTecnicos(supuestosBase)
    const leads = calcularLeads(escenario, supuestos)
    const embudo = calcularEmbudo(escenario, supuestos, leads)
    const finanzas = calcularFinanzas(escenario, supuestos, leads, embudo)
    return { leadsMeta: leads.meta, leadsGoogle: leads.google, ...embudo, ...finanzas }
  }

  function calcularTrampa(r, supuestos) {
    return {
      cplMeta: r.cplMeta,
      cplGoogle: r.cplGoogle,
      cacMeta: r.cacRealMeta,
      cacGoogle: r.cacRealGoogle,
      vecesMasBaratoLead: r.cplMeta && r.cplGoogle ? r.cplGoogle / r.cplMeta : null,
      sobrecostoCliente: r.cacRealMeta && r.cacRealGoogle ? r.cacRealMeta / r.cacRealGoogle - 1 : null,
      capacidad: supuestos.capacidad,
    }
  }

  const aPlan = (p) => ({ ...p, tecnicos: [p.tecnico1, p.tecnico2].filter((m) => m > 0) })

  function simular(plan, S) {
    let caja = S.cajaInicial
    let ventasPrev = S.ventasMesAnterior
    const tecnicos = (plan.tecnicos || []).slice(0, 2)
    const filas = []

    for (let mes = 1; mes <= MESES; mes++) {
      const usaFase2 = plan.escalaDesde > 0 && mes >= plan.escalaDesde
      const customMes = plan.mesesCustom && plan.mesesCustom[mes - 1]
      const metaMes = customMes && customMes.meta != null ? customMes.meta : usaFase2 ? (plan.metaFase2 ?? plan.meta) : plan.meta
      const googleMes = customMes && customMes.google != null ? customMes.google : usaFase2 ? (plan.googleFase2 ?? plan.google) : plan.google

      const activos = tecnicos.filter((h) => h < mes).length
      const pagados = tecnicos.filter((h) => h <= mes).length
      const filtro = plan.filtroDesde > 0 && mes >= plan.filtroDesde ? 1 : 0
      const e = { meta: metaMes, google: googleMes, filtro, bateria: 0, cplFijo: 0 }
      const Sm = { ...S, capacidad: S.capacidad + activos * S.visitasPorTecnico }

      const leads = calcularLeads(e, Sm)
      const emb = calcularEmbudo(e, Sm, leads)

      const entradas = S.precio * 0.5 * (emb.ventas + ventasPrev)
      const salidas =
        S.precio * (S.equipos + S.comision) * emb.ventas +
        S.precio * S.instalacion * ventasPrev +
        S.costoVisita * emb.realizadas +
        metaMes +
        googleMes +
        S.costosFijos +
        S.costoTecnico * pagados
      caja = caja + entradas - salidas

      filas.push({
        mes,
        meta: metaMes,
        google: googleMes,
        leads: leads.meta + leads.google,
        pedidas: emb.solicitadas,
        capacidad: Sm.capacidad,
        hechas: emb.realizadas,
        perdidas: emb.perdidas,
        ventas: emb.ventas,
        entradas,
        salidas,
        caja,
        alerta: caja < S.pisoCaja,
      })
      ventasPrev = emb.ventas
    }
    return filas
  }

  function resumirPlan(filas, S) {
    const min = filas.reduce((a, f) => (f.caja < a.caja ? f : a), filas[0])
    const respetaMes19 = filas.every((f, i) => f.mes < 19 || f.meta + f.google >= filas[i - 1].meta + filas[i - 1].google)
    const respetaPiso = filas.every((f) => f.caja >= S.pisoCaja)
    return {
      cajaMinima: min.caja,
      mesCajaMinima: min.mes,
      cajaMes24: filas[filas.length - 1].caja,
      instalaciones: filas.reduce((s, f) => s + f.ventas, 0),
      respetaPiso,
      respetaMes19,
      cumpleReglas: respetaMes19 && respetaPiso,
    }
  }

  function detalleMes1(S, plan = { meta: 4000, google: 4000, filtroDesde: 0, tecnicos: [] }) {
    const e = { meta: plan.meta, google: plan.google, filtro: plan.filtroDesde === 1 ? 1 : 0, bateria: 0, cplFijo: 0 }
    const leads = calcularLeads(e, S)
    const emb = calcularEmbudo(e, S, leads)
    const ventasPrev = S.ventasMesAnterior
    const entradasMes = S.precio * 0.5 * emb.ventas
    const entradasPrev = S.precio * 0.5 * ventasPrev
    const equipos = S.precio * S.equipos * emb.ventas
    const comision = S.precio * S.comision * emb.ventas
    const instalacion = S.precio * S.instalacion * ventasPrev
    const visitas = S.costoVisita * emb.realizadas
    const entradas = entradasMes + entradasPrev
    const salidas = equipos + comision + instalacion + visitas + plan.meta + plan.google + S.costosFijos
    return {
      leads,
      emb,
      ventasPrev,
      entradasMes,
      entradasPrev,
      entradas,
      equipos,
      comision,
      instalacion,
      visitas,
      salidas,
      cajaFinal: S.cajaInicial + entradas - salidas,
    }
  }

  // Conexión con Excel (.xlsx)
  const norm = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const PARAMETROS = [
    ['Precio instalación', 'precio'],
    ['Equipos / precio', 'equipos'],
    ['Instalación / precio', 'instalacion'],
    ['Comisión de venta / precio', 'comision'],
    ['Costo por visita', 'costoVisita'],
    ['Capacidad de visitas al mes', 'capacidad'],
    ['CPL Meta prometido por agencia', 'cplPrometido'],
    ['Meta: tasa de contacto', 'meta.contacto'],
    ['Meta: tasa de agenda', 'meta.agenda'],
    ['Meta: visitas hechas / agendadas', 'meta.visita'],
    ['Meta: tasa de cierre', 'meta.cierre'],
    ['Google: tasa de contacto', 'google.contacto'],
    ['Google: tasa de agenda', 'google.agenda'],
    ['Google: visitas hechas / agendadas', 'google.visita'],
    ['Google: tasa de cierre', 'google.cierre'],
    ['Filtro: reducción de leads Meta', 'filtro.reduccionLeads'],
    ['Filtro: contacto Meta', 'filtro.contacto'],
    ['Filtro: agenda Meta', 'filtro.agenda'],
    ['Filtro: visita Meta', 'filtro.visita'],
    ['Filtro: cierre Meta', 'filtro.cierre'],
    ['Batería: precio', 'bateria.precio'],
    ['Batería: margen bruto', 'bateria.margen'],
    ['Batería: comisión', 'bateria.comision'],
    ['Batería: adopción estimada', 'bateria.adopcion'],
    ['Costos fijos mensuales', 'costosFijos'],
    ['Caja inicial', 'cajaInicial'],
    ['Piso mínimo de caja', 'pisoCaja'],
    ['Ventas del mes anterior', 'ventasMesAnterior'],
  ]

  const FILAS_ESCENARIO = [
    ['Inversión Meta', 'meta'],
    ['Inversión Google', 'google'],
    ['Filtro Meta: 1 sí / 0 no', 'filtro'],
    ['Batería: 1 sí / 0 no', 'bateria'],
    ['CPL fijo: 1 sí / 0 historial', 'cplFijo'],
  ]

  const INDICADORES_EXCEL = [
    ['Leads Meta', 'leadsMeta'],
    ['Leads Google', 'leadsGoogle'],
    ['Visitas solicitadas totales', 'solicitadas'],
    ['Visitas perdidas por capacidad', 'perdidas'],
    ['Ventas totales esperadas', 'ventas'],
    ['Contribución después de marketing', 'despuesMarketing'],
    ['Después de marketing y costos fijos', 'neto'],
    ['CPL Meta', 'cplMeta'],
    ['CPL Google', 'cplGoogle'],
    ['CAC anuncios Meta', 'cacAnunciosMeta'],
    ['CAC anuncios Google', 'cacAnunciosGoogle'],
    ['CAC real Meta', 'cacRealMeta'],
    ['CAC real Google', 'cacRealGoogle'],
    ['CAC real combinado', 'cacCombinado'],
    ['LTV:CAC Meta', 'ltvCacMeta'],
    ['LTV:CAC Google', 'ltvCacGoogle'],
    ['Valor de visita Meta', 'valorVisitaMeta'],
    ['Valor de visita Google', 'valorVisitaGoogle'],
    ['Uso de capacidad', 'usoCapacidad'],
    ['Caja final mes 1 (sin batería)', 'cajaFinalMes1'],
  ]

  const esNum = (v) => typeof v === 'number' && Number.isFinite(v)

  function parsearSupuestos(filas, base, escenariosBase) {
    const porEtiqueta = new Map()
    for (const f of filas) if (f && f[0] != null && esNum(Number(f[1])) && f[1] !== '' && f[1] != null) porEtiqueta.set(norm(f[0]), Number(f[1]))

    let supuestos = clonar(base)
    const cargados = []
    const faltantes = []
    for (const [etiqueta, ruta] of PARAMETROS) {
      const v = porEtiqueta.get(norm(etiqueta))
      if (v === undefined) faltantes.push(etiqueta)
      else {
        supuestos = asignarRuta(supuestos, ruta, v)
        cargados.push(etiqueta)
      }
    }

    const iCurva = filas.findIndex((f) => f && norm(f[0]) === 'inversion' && norm(f[1]) === 'meta')
    if (iCurva >= 0) {
      const curva = []
      for (const f of filas.slice(iCurva + 1)) {
        if (f && esNum(f[0]) && esNum(f[1]) && esNum(f[2])) curva.push({ inv: f[0], meta: f[1], google: f[2] })
        else if (curva.length) break
      }
      if (curva.length >= 2) {
        supuestos = { ...supuestos, curva }
        cargados.push('Curva de leads por inversión')
      } else faltantes.push('Curva de leads por inversión')
    } else faltantes.push('Curva de leads por inversión')

    let escenarios = escenariosBase.map((e) => ({ ...e }))
    for (const [etiqueta, campo] of FILAS_ESCENARIO) {
      const fila = filas.find((f) => f && norm(f[3]) === norm(etiqueta))
      if (!fila) {
        faltantes.push(`Escenarios: ${etiqueta}`)
        continue
      }
      escenarios = escenarios.map((e, i) => (esNum(fila[4 + i]) ? { ...e, [campo]: fila[4 + i] } : e))
    }
    const filaNombres = filas.find((f) => f && norm(f[3]) === 'escenario')
    if (filaNombres) {
      escenarios = escenarios.map((e, i) => (filaNombres[4 + i] ? { ...e, nombre: String(filaNombres[4 + i]) } : e))
    }
    return { supuestos, escenarios, cargados, faltantes }
  }

  function compararConExcel(filas, resultados) {
    const comparaciones = []
    for (const [etiqueta, clave] of INDICADORES_EXCEL) {
      const fila = filas.find((f) => f && norm(f[0]) === norm(etiqueta))
      if (!fila) continue
      resultados.forEach((e, i) => {
        const excel = fila[1 + i]
        const app = e.r[clave]
        if (!esNum(excel) || !esNum(app)) return
        const dif = excel === 0 ? Math.abs(app) : Math.abs(app - excel) / Math.abs(excel)
        comparaciones.push({ indicador: etiqueta, escenario: e.nombre, excel, app, dif })
      })
    }
    const max = comparaciones.reduce((m, c) => Math.max(m, c.dif), 0)
    return { comparaciones, max, coincide: comparaciones.length > 0 && max < 0.01 }
  }

  // Formateadores numéricos
  const usdFmt = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  const numFmt = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 })
  const intFmt = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 })
  const ok = (v) => typeof v === 'number' && Number.isFinite(v)

  const fmt = {
    usd: (v) => (!ok(v) ? '—' : usdFmt.format(v)),
    usdInt: (v) => (!ok(v) ? '—' : `US$${intFmt.format(Math.round(v))}`),
    num: (v) => (!ok(v) ? '—' : numFmt.format(v)),
    pct: (v) => (!ok(v) ? '—' : `${numFmt.format(v * 100)}%`),
    mult: (v) => (!ok(v) ? '—' : `${numFmt.format(v)}x`),
    leads: (v) => (!ok(v) ? '—' : `${numFmt.format(v)} leads`),
    visitas: (v) => (!ok(v) ? '—' : `${numFmt.format(v)} visitas`),
    ventas: (v) => (!ok(v) ? '—' : `${numFmt.format(v)} ventas`),
    visitasVenta: (v) => (!ok(v) ? '—' : `${numFmt.format(v)} vis./venta`),
  }

  function semaforoHTML(valor, texto) {
    const cls = !ok(valor) ? 'badge-gris' : valor >= 3 ? 'badge-verde' : valor >= 1 ? 'badge-amarillo' : 'badge-rojo'
    const dot = !ok(valor) ? '○' : '●'
    return `<span class="badge-semaforo ${cls}"><span>${dot}</span><span>${texto}</span></span>`
  }

  const INDICADORES_TABLA = [
    ['Leads Meta (leads/mes)', 'leadsMeta', fmt.leads],
    ['Leads Google (leads/mes)', 'leadsGoogle', fmt.leads],
    ['Leads totales (leads/mes)', 'leadsTotales', fmt.leads],
    ['Contactados Meta (personas)', 'contactadosMeta', fmt.num],
    ['Contactados Google (personas)', 'contactadosGoogle', fmt.num],
    ['Agendadas Meta (visitas)', 'agendadasMeta', fmt.visitas],
    ['Agendadas Google (visitas)', 'agendadasGoogle', fmt.visitas],
    ['Visitas solicitadas Meta', 'solicitadasMeta', fmt.visitas],
    ['Visitas solicitadas Google', 'solicitadasGoogle', fmt.visitas],
    ['Visitas solicitadas totales', 'solicitadas', fmt.visitas],
    ['Visitas realizadas Google', 'hechasGoogle', fmt.visitas],
    ['Visitas realizadas Meta', 'hechasMeta', fmt.visitas],
    ['Visitas realizadas totales', 'realizadas', fmt.visitas],
    ['Visitas perdidas por capacidad', 'perdidas', fmt.visitas],
    ['Uso de capacidad (%)', 'usoCapacidad', fmt.pct],
    ['Ventas esperadas Meta', 'ventasMeta', fmt.ventas],
    ['Ventas esperadas Google', 'ventasGoogle', fmt.ventas],
    ['Ventas totales esperadas', 'ventas', fmt.ventas],
    ['Contribución media por venta (USD)', 'contribPorVenta', fmt.usd],
    ['Contribución total antes de marketing', 'contribucion', fmt.usd],
    ['Inversión en anuncios totales (USD)', 'anuncios', fmt.usd],
    ['Costo de visitas técnicas (USD)', 'costoVisitas', fmt.usd],
    ['Contribución después de marketing', 'despuesMarketing', fmt.usd],
    ['Resultado tras costos fijos (USD)', 'neto', fmt.usd],
    ['CPL Meta (USD/lead)', 'cplMeta', fmt.usd],
    ['CPL Google (USD/lead)', 'cplGoogle', fmt.usd],
    ['CAC solo anuncios Meta (USD/venta)', 'cacAnunciosMeta', fmt.usd],
    ['CAC solo anuncios Google (USD/venta)', 'cacAnunciosGoogle', fmt.usd],
    ['CAC real Meta: anuncios + visitas', 'cacRealMeta', fmt.usd],
    ['CAC real Google: anuncios + visitas', 'cacRealGoogle', fmt.usd],
    ['CAC real combinado (USD/venta)', 'cacCombinado', fmt.usd],
    ['LTV:CAC Meta (veces)', 'ltvCacMeta', fmt.mult],
    ['LTV:CAC Google (veces)', 'ltvCacGoogle', fmt.mult],
    ['LTV:CAC combinado (veces)', 'ltvCacCombinado', fmt.mult],
    ['Visitas necesarias por venta Meta', 'visitasPorVentaMeta', fmt.visitasVenta],
    ['Visitas necesarias por venta Google', 'visitasPorVentaGoogle', fmt.visitasVenta],
    ['Valor esperado visita Meta (USD)', 'valorVisitaMeta', fmt.usd],
    ['Valor esperado visita Google (USD)', 'valorVisitaGoogle', fmt.usd],
    ['Payback Meta: mes de firma (USD)', 'paybackMetaFirma', fmt.usd],
    ['Payback Meta: mes siguiente (USD)', 'paybackMetaSiguiente', fmt.usd],
    ['Payback Google: mes de firma (USD)', 'paybackGoogleFirma', fmt.usd],
    ['Payback Google: mes siguiente (USD)', 'paybackGoogleSiguiente', fmt.usd],
    ['Caja final Mes 1 sin batería (USD)', 'cajaFinalMes1', fmt.usd],
  ]

  function construirHojasExportacion({ supuestos, escenarios, resultados, simulaciones }) {
    const hojaSupuestos = []
    const nFilas = Math.max(PARAMETROS.length, FILAS_ESCENARIO.length + 1)
    for (let i = 0; i < nFilas; i++) {
      const p = PARAMETROS[i]
      const cabecera = i === 0
      const fe = FILAS_ESCENARIO[i - 1]
      hojaSupuestos.push([
        p ? p[0] : null,
        p ? leerRuta(supuestos, p[1]) : null,
        null,
        cabecera ? 'Escenario' : fe ? fe[0] : null,
        ...escenarios.map((e) => (cabecera ? e.nombre : fe ? e[fe[1]] : null)),
      ])
    }
    hojaSupuestos.push([])
    hojaSupuestos.push(['Historial de inversión y contactos por mes'])
    hojaSupuestos.push(['Inversión', 'Meta', 'Google'])
    for (const c of supuestos.curva) hojaSupuestos.push([c.inv, c.meta, c.google])

    const hojaResultados = [['Indicador', ...resultados.map((e) => e.nombre)]]
    for (const [etiqueta, clave] of INDICADORES_TABLA) {
      hojaResultados.push([etiqueta, ...resultados.map((e) => (ok(e.r[clave]) ? Number(e.r[clave].toFixed(4)) : null))])
    }

    const hojaSim = [['Simulador de 24 meses (la batería no entra en la caja)']]
    for (const s of simulaciones) {
      hojaSim.push([])
      hojaSim.push([`Plan: ${s.nombre}`])
      hojaSim.push(['Mes', 'Meta', 'Google', 'Leads', 'Visitas pedidas', 'Capacidad', 'Visitas hechas', 'Ventas', 'Entradas', 'Salidas', 'Caja final', 'Bajo el piso'])
      for (const f of s.filas) {
        hojaSim.push([f.mes, f.meta, f.google, Number(f.leads.toFixed(2)), Number(f.pedidas.toFixed(2)), f.capacidad, Number(f.hechas.toFixed(2)), Number(f.ventas.toFixed(3)), Number(f.entradas.toFixed(2)), Number(f.salidas.toFixed(2)), Number(f.caja.toFixed(2)), f.alerta ? 'SÍ' : 'no'])
      }
    }

    return { Supuestos: hojaSupuestos, Resultados: hojaResultados, Simulador: hojaSim }
  }

  window.SolDeCasa = {
    SUPUESTOS_BASE,
    ESCENARIOS_BASE,
    PLANES_INICIALES,
    PARAMETROS,
    INDICADORES_TABLA,
    MESES,
    clonar,
    leerRuta,
    asignarRuta,
    conTecnicos,
    calcular,
    calcularTrampa,
    aPlan,
    simular,
    resumirPlan,
    detalleMes1,
    parsearSupuestos,
    compararConExcel,
    construirHojasExportacion,
    fmt,
    semaforoHTML,
  }
})()

