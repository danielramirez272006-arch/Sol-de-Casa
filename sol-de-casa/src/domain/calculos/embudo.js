// Identifica el paso donde cae más gente (en volumen y en %) para un canal.
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

// Etapa 2: leads -> visitas -> ventas, con límite de capacidad (Google tiene prioridad)
export function calcularEmbudo(e, S, leads) {
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
