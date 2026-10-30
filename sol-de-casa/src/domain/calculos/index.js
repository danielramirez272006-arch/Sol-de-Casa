import { calcularLeads } from './leads.js'
import { calcularEmbudo } from './embudo.js'
import { calcularFinanzas } from './finanzas.js'
import { conTecnicos } from '../tecnicos.js'

// Punto de entrada del modelo: escenario + supuestos -> indicadores planos.
export function calcular(escenario, supuestosBase) {
  const supuestos = conTecnicos(supuestosBase)
  const leads = calcularLeads(escenario, supuestos)
  const embudo = calcularEmbudo(escenario, supuestos, leads)
  const finanzas = calcularFinanzas(escenario, supuestos, leads, embudo)
  return { leadsMeta: leads.meta, leadsGoogle: leads.google, ...embudo, ...finanzas }
}
