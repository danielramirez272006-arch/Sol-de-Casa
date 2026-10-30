// Conexión con Excel: lectura de la hoja "Supuestos" del libro del caso, comparación contra la
// hoja "Resultados" y construcción del libro de exportación (con el mismo formato, así que se puede reimportar).

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

// [etiqueta en la hoja Supuestos (columna A), ruta en nuestros supuestos]
export const PARAMETROS = [
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

// Filas de escenarios (columna D en la hoja): [etiqueta, campo]
const FILAS_ESCENARIO = [
  ['Inversión Meta', 'meta'],
  ['Inversión Google', 'google'],
  ['Filtro Meta: 1 sí / 0 no', 'filtro'],
  ['Batería: 1 sí / 0 no', 'bateria'],
  ['CPL fijo: 1 sí / 0 historial', 'cplFijo'],
]

// Indicadores de la hoja "Resultados" (etiqueta en el Excel) -> clave de nuestro modelo
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

const leer = (obj, ruta) => ruta.split('.').reduce((o, k) => o?.[k], obj)
function asignar(obj, ruta, valor) {
  const [k, ...resto] = ruta.split('.')
  return { ...obj, [k]: resto.length ? asignar(obj[k], resto.join('.'), valor) : valor }
}
const esNum = (v) => typeof v === 'number' && Number.isFinite(v)

// Lee la hoja "Supuestos" (filas = array de arrays) y devuelve supuestos y escenarios nuevos.
export function parsearSupuestos(filas, base, escenariosBase) {
  const porEtiqueta = new Map()
  for (const f of filas) if (f?.[0] != null && esNum(f[1])) porEtiqueta.set(norm(f[0]), f[1])

  let supuestos = base
  const cargados = []
  const faltantes = []
  for (const [etiqueta, ruta] of PARAMETROS) {
    const v = porEtiqueta.get(norm(etiqueta))
    if (v === undefined) faltantes.push(etiqueta)
    else {
      supuestos = asignar(supuestos, ruta, v)
      cargados.push(etiqueta)
    }
  }

  // Curva inversión -> leads: filas con tres números tras el encabezado "Inversión | Meta | Google"
  const iCurva = filas.findIndex((f) => norm(f?.[0]) === 'inversion' && norm(f?.[1]) === 'meta')
  if (iCurva >= 0) {
    const curva = []
    for (const f of filas.slice(iCurva + 1)) {
      if (esNum(f?.[0]) && esNum(f?.[1]) && esNum(f?.[2])) curva.push({ inv: f[0], meta: f[1], google: f[2] })
      else if (curva.length) break
    }
    if (curva.length >= 2) {
      supuestos = { ...supuestos, curva }
      cargados.push('Curva de leads por inversión')
    } else faltantes.push('Curva de leads por inversión')
  } else faltantes.push('Curva de leads por inversión')

  // Escenarios: columnas E..I (índices 4..8) de las filas cuya columna D coincide
  let escenarios = escenariosBase.map((e) => ({ ...e }))
  for (const [etiqueta, campo] of FILAS_ESCENARIO) {
    const fila = filas.find((f) => norm(f?.[3]) === norm(etiqueta))
    if (!fila) {
      faltantes.push(`Escenarios: ${etiqueta}`)
      continue
    }
    escenarios = escenarios.map((e, i) => (esNum(fila[4 + i]) ? { ...e, [campo]: fila[4 + i] } : e))
  }
  const filaNombres = filas.find((f) => norm(f?.[3]) === 'escenario')
  if (filaNombres) {
    escenarios = escenarios.map((e, i) => (filaNombres[4 + i] ? { ...e, nombre: String(filaNombres[4 + i]) } : e))
  }
  return { supuestos, escenarios, cargados, faltantes }
}

// Compara los valores calculados por la hoja "Resultados" del Excel con los de la app.
// resultados = [{ nombre, r }] en el mismo orden que las columnas B..F del Excel.
export function compararConExcel(filas, resultados) {
  const comparaciones = []
  for (const [etiqueta, clave] of INDICADORES_EXCEL) {
    const fila = filas.find((f) => norm(f?.[0]) === norm(etiqueta))
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

const numOrNull = (v) => (esNum(v) ? v : null)

// Libro de exportación: Supuestos (mismo formato que el del caso), Resultados y Simulador.
export function construirLibro({ supuestos, escenarios, resultados, indicadores, simulaciones }) {
  const hojaSupuestos = []
  const nFilas = Math.max(PARAMETROS.length, FILAS_ESCENARIO.length + 1)
  for (let i = 0; i < nFilas; i++) {
    const p = PARAMETROS[i]
    const cabecera = i === 0
    const fe = FILAS_ESCENARIO[i - 1]
    hojaSupuestos.push([
      p ? p[0] : null,
      p ? numOrNull(leer(supuestos, p[1])) : null,
      null,
      cabecera ? 'Escenario' : fe ? fe[0] : null,
      ...escenarios.map((e) => (cabecera ? e.nombre : fe ? numOrNull(e[fe[1]]) : null)),
    ])
  }
  hojaSupuestos.push([])
  hojaSupuestos.push(['Historial de inversión y contactos por mes'])
  hojaSupuestos.push(['Inversión', 'Meta', 'Google'])
  for (const c of supuestos.curva) hojaSupuestos.push([c.inv, c.meta, c.google])

  const hojaResultados = [['Indicador', ...resultados.map((e) => e.nombre)]]
  for (const [etiqueta, clave] of indicadores) {
    hojaResultados.push([etiqueta, ...resultados.map((e) => numOrNull(e.r[clave]))])
  }

  const hojaSim = [['Simulador de 24 meses (la batería no entra en la caja)']]
  for (const s of simulaciones) {
    hojaSim.push([])
    hojaSim.push([`Plan: ${s.nombre}`])
    hojaSim.push(['Mes', 'Meta', 'Google', 'Leads', 'Visitas pedidas', 'Capacidad', 'Visitas hechas', 'Ventas', 'Entradas', 'Salidas', 'Caja final', 'Bajo el piso'])
    for (const f of s.filas) {
      hojaSim.push([f.mes, f.meta, f.google, f.leads, f.pedidas, f.capacidad, f.hechas, f.ventas, f.entradas, f.salidas, f.caja, f.alerta ? 'SÍ' : 'no'])
    }
  }

  return [
    { sheet: 'Supuestos', data: hojaSupuestos },
    { sheet: 'Resultados', data: hojaResultados },
    { sheet: 'Simulador', data: hojaSim },
  ]
}
