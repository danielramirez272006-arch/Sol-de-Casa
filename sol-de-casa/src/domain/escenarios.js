// Escenarios de la hoja "Supuestos" (columnas E:I)
export const ESCENARIOS_BASE = [
  { id: 'actual', nombre: 'Actual', meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 },
  { id: 'agHist', nombre: 'Agencia: historial', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 0 },
  { id: 'agPromesa', nombre: 'Agencia: promesa', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 1 },
  { id: 'filtro', nombre: 'Solo filtro', meta: 4000, google: 4000, filtro: 1, bateria: 0, cplFijo: 0 },
  { id: 'propuesta', nombre: 'Filtro y batería', meta: 4000, google: 4000, filtro: 1, bateria: 1, cplFijo: 0 },
]

