export { SUPUESTOS_BASE } from './modelo/supuestos.js'
export { ESCENARIOS_BASE } from './modelo/escenarios.js'
export { PLANES_INICIALES, aPlan } from './modelo/planes.js'
export { conTecnicos } from './modelo/tecnicos.js'
export { calcularTrampa } from './modelo/trampa.js'

export { calcular } from './calculos/index.js'
export { calcularLeads, leadsPorInversion } from './calculos/leads.js'
export { calcularEmbudo, analizarCaidas } from './calculos/embudo.js'
export { calcularFinanzas } from './calculos/finanzas.js'

export { MESES, simular, resumirPlan, detalleMes1 } from './simulador/simulador.js'
export { PARAMETROS, parsearSupuestos, compararConExcel, construirLibro } from './excel/excel.js'
