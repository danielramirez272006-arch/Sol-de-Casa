import { describe, expect, it } from 'vitest'
import { detalleMes1, simular, resumirPlan, SUPUESTOS_BASE, PLANES_INICIALES, aPlan } from '@/domain'

const actual = { meta: 4000, google: 4000, filtroDesde: 0, tecnicos: [] }

describe('simulador de 24 meses', () => {
  const filas = simular(actual, SUPUESTOS_BASE)

  it('genera 24 filas', () => expect(filas).toHaveLength(24))
  it('mes 1 del plan actual: caja final ≈ 15.736,30 (coincide con el Excel)', () =>
    expect(filas[0].caja).toBeCloseTo(15736.3, 2))
  it('mes 1: ventas ≈ 22,32 y visitas pedidas dentro de la capacidad', () => {
    expect(filas[0].ventas).toBeCloseTo(10.395 + 11.92125, 3)
    expect(filas[0].pedidas).toBeLessThanOrEqual(100)
  })
  it('el plan actual respeta el piso de caja', () => expect(resumirPlan(filas, SUPUESTOS_BASE).respetaPiso).toBe(true))
  it('regla del mes 19: inversión constante la cumple, bajar la inversión no', () => {
    expect(resumirPlan(filas, SUPUESTOS_BASE).respetaMes19).toBe(true)
    const bajando = filas.map((f) => ({ ...f, meta: f.mes === 20 ? f.meta - 1000 : f.meta }))
    expect(resumirPlan(bajando, SUPUESTOS_BASE).respetaMes19).toBe(false)
  })
  it('detalle del mes 1 cuadra con la fila 1 del simulador', () => {
    const d = detalleMes1(SUPUESTOS_BASE)
    expect(d.entradas).toBeCloseTo(filas[0].entradas, 6)
    expect(d.salidas).toBeCloseTo(filas[0].salidas, 6)
    expect(d.cajaFinal).toBeCloseTo(15736.3, 2)
  })
  it('un técnico extra solo suma capacidad desde el mes siguiente', () => {
    const f = simular({ ...actual, tecnicos: [2] }, SUPUESTOS_BASE)
    expect(f[1].capacidad).toBe(100)
    expect(f[2].capacidad).toBe(150)
  })
  it('los caminos en 2 fases (Propios B y C) respetan reglas y superan $675.000 de caja al mes 24', () => {
    for (const id of ['p4', 'p5']) {
      const p = PLANES_INICIALES.find((x) => x.id === id)
      const res = resumirPlan(simular(aPlan(p), SUPUESTOS_BASE), SUPUESTOS_BASE)
      expect(res.cumpleReglas).toBe(true)
      expect(res.cajaMes24).toBeGreaterThan(675000)
    }
  })
  it('permite sobrescribir inversiones mes a mes con mesesCustom', () => {
    const mesesCustom = Array.from({ length: 24 }, (_, i) => ({
      meta: i < 2 ? 4000 : 6000,
      google: i < 2 ? 4000 : 6000,
    }))
    const f = simular({ ...actual, mesesCustom }, SUPUESTOS_BASE)
    expect(f[0].meta).toBe(4000)
    expect(f[2].meta).toBe(6000)
    expect(f[2].google).toBe(6000)
    expect(resumirPlan(f, SUPUESTOS_BASE).respetaMes19).toBe(true)
  })
})
