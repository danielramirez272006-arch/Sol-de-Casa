import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const R = require('../../web/src/js/domain/referidos.js')

describe('Parte 2 · Ciclo de Referidos y Presupuesto de Recompensas', () => {
  it('calcula exactamente $77 de ahorro mensual (70%) sobre un recibo anterior de $110', () => {
    const fam = R.calcularAhorroFamilia(110, 0.7, 8)
    expect(fam.ahorroMensual).toBeCloseTo(77, 5)
    expect(fam.reciboNuevo).toBeCloseTo(33, 5)
    expect(fam.ahorroAcumulado).toBeCloseTo(616, 5)
  })

  it('calcula el ahorro estimado y los años de recuperación sobre una instalación de $6.500', () => {
    const vec = R.calcularAhorroVecino({ reciboMensual: 110, pctAhorro: 0.7, precioInstalacion: 6500, bonoVecino: 60 })
    expect(vec.ahorroMensual).toBeCloseTo(77, 5)
    expect(vec.ahorroAnual).toBeCloseTo(924, 5)
    expect(vec.aniosRecuperacion).toBeCloseTo(6500 / 924, 4)
    expect(vec.aniosConBono).toBeCloseTo(6440 / 924, 4)
  })

  it('descuenta $133,33 de visitas (45% cierre a $60) antes de premiar y respeta el máximo de $300/venta', () => {
    const p = R.calcularPresupuestoRecompensas()
    expect(p.visitasPorVenta).toBeCloseTo(1 / 0.45, 5)
    expect(p.costoVisitasPorVenta).toBeCloseTo(133.3333, 3)
    expect(p.presupuestoDisponible).toBeCloseTo(166.6667, 3)
    expect(p.premiosTotales).toBe(160)
    expect(p.cacTotalReferido).toBeCloseTo(293.3333, 3)
    expect(p.cumpleTope).toBe(true)
    expect(p.ltvCacReferido).toBeCloseTo(1625 / (133.3333333 + 160), 2)
  })

  it('marca incumplimiento si la suma de premios supera el presupuesto disponible de $166,67', () => {
    const exceso = R.calcularPresupuestoRecompensas({ premioReferidor: 120, premioVecino: 60 })
    expect(exceso.cacTotalReferido).toBeGreaterThan(300)
    expect(exceso.cumpleTope).toBe(false)
  })
})

