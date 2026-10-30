import { calcularLeads } from '../calculos/leads.js'
import { calcularEmbudo } from '../calculos/embudo.js'

export const MESES = 24

// plan = {
//   nombre, meta, google,
//   escalaDesde (0 = inversión fija; >0 = desde ese mes pasa a metaFase2 / googleFase2),
//   metaFase2, googleFase2,
//   filtroDesde (0 = nunca), tecnicos: [mes de contratación, ...]
// }
// Reglas del caso (nivel 3): entradas 50% del precio por ventas del mes + 50% del mes anterior;
// salidas: equipos+comisión (mes de venta), instalación (mes siguiente), visitas, anuncios,
// costos fijos y técnicos extra (pagados desde el mes de contratación; capacidad desde el siguiente).
// La batería no entra en la caja (el cobro no está definido en el caso).
export function simular(plan, S) {
  let caja = S.cajaInicial
  let ventasPrev = S.ventasMesAnterior
  const tecnicos = (plan.tecnicos || []).slice(0, 2)
  const filas = []

  for (let mes = 1; mes <= MESES; mes++) {
    const usaFase2 = plan.escalaDesde > 0 && mes >= plan.escalaDesde
    const customMes = plan.mesesCustom?.[mes - 1]
    const metaMes = customMes?.meta ?? (usaFase2 ? (plan.metaFase2 ?? plan.meta) : plan.meta)
    const googleMes = customMes?.google ?? (usaFase2 ? (plan.googleFase2 ?? plan.google) : plan.google)

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

export function resumirPlan(filas, S) {
  const min = filas.reduce((a, f) => (f.caja < a.caja ? f : a), filas[0])
  // Regla del caso: desde el mes 19 la inversión total no puede bajar de un mes al siguiente
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

// Mes 1 con cada cuenta a la vista (plan actual por defecto), para verificar a mano.
export function detalleMes1(S, plan = { meta: 4000, google: 4000, filtroDesde: 0, tecnicos: [] }) {
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
