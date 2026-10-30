// Etapa 1: inversión -> leads (interpolación lineal por tramos de la curva histórica)
const TOPE_INVERSION = { meta: 10000, google: 8000 } // rangos permitidos por el caso

export function leadsPorInversion(inv, canal, curva) {
  if (inv < 0 || inv > TOPE_INVERSION[canal]) return 0
  let total = 0
  for (let i = 1; i < curva.length; i++) {
    const a = curva[i - 1]
    const b = curva[i]
    total += (Math.min(Math.max(inv - a.inv, 0), b.inv - a.inv) * (b[canal] - a[canal])) / (b.inv - a.inv)
  }
  return total
}

export function calcularLeads(e, S) {
  const base = e.cplFijo ? e.meta / S.cplPrometido : leadsPorInversion(e.meta, 'meta', S.curva)
  return {
    meta: base * (1 - e.filtro * S.filtro.reduccionLeads),
    google: leadsPorInversion(e.google, 'google', S.curva),
  }
}

