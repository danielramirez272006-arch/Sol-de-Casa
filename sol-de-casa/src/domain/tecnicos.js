// Aplica los técnicos extra "ya activos" (modo estático de las pestañas Resultados/Gráficos):
// suma capacidad y costo fijo. El simulador de 24 meses los maneja mes a mes por su cuenta.
export function conTecnicos(S) {
  const n = Math.min(2, Math.max(0, Math.round(S.tecnicosExtra || 0)))
  return {
    ...S,
    capacidad: S.capacidad + n * S.visitasPorTecnico,
    costosFijos: S.costosFijos + n * S.costoTecnico,
  }
}

