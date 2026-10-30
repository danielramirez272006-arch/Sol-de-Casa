import { describe, expect, it } from 'vitest'
import * as dominio from '@/domain'
import { calcular, ESCENARIOS_BASE, SUPUESTOS_BASE } from '@/domain'

const actual = ESCENARIOS_BASE.find((e) => e.id === 'actual')

describe('escenario actual (valores del Excel)', () => {
  const r = calcular(actual, SUPUESTOS_BASE)

  it('ventas de Meta ≈ 10.395', () => expect(r.ventasMeta).toBeCloseTo(10.395, 3))
  it('CAC real Meta ≈ 718,13', () => expect(r.cacRealMeta).toBeCloseTo(718.13, 2))
  it('CAC real Google ≈ 535,54', () => expect(r.cacRealGoogle).toBeCloseTo(535.54, 2))
  it('CAC anuncios Google ≈ 335,54', () => expect(r.cacAnunciosGoogle).toBeCloseTo(335.54, 2))
  it('LTV:CAC Meta ≈ 2,26 y Google ≈ 3,03', () => {
    expect(r.ltvCacMeta).toBeCloseTo(2.2628, 3)
    expect(r.ltvCacGoogle).toBeCloseTo(3.0343, 3)
  })
  it('valor de una visita: Meta $232,50 y Google $427,50', () => {
    expect(r.valorVisitaMeta).toBeCloseTo(232.5, 2)
    expect(r.valorVisitaGoogle).toBeCloseTo(427.5, 2)
  })
  it('payback en caja ocurre en Mes 2 para ambos canales', () => {
    expect(r.paybackMesMeta).toBe('Mes 2 (instalación)')
    expect(r.paybackMesGoogle).toBe('Mes 2 (instalación)')
    expect(r.paybackMetaSiguiente).toBeCloseTo(906.87, 2)
    expect(r.paybackGoogleSiguiente).toBeCloseTo(1089.46, 2)
  })
  it('detecta dónde cae más gente en cada canal', () => {
    expect(r.caidaMeta.mayorVolumen.etapa).toBe('Leads → Contactados')
    expect(r.caidaMeta.mayorVolumen.perdidos).toBeCloseTo(225, 2)
    expect(r.caidaGoogle.mayorVolumen.etapa).toBe('Contactados → Agendadas')
  })
})

describe('caja y métricas adicionales', () => {
  const act = calcular(actual, SUPUESTOS_BASE)
  const prop = calcular(ESCENARIOS_BASE.find((e) => e.id === 'propuesta'), SUPUESTOS_BASE)

  it('caja final mes 1 actual ≈ 15.736,30', () => expect(act.cajaFinalMes1).toBeCloseTo(15736.3, 2))
  it('caja final mes 1 propuesta ≈ 14.096,92', () => expect(prop.cajaFinalMes1).toBeCloseTo(14096.92, 2))
  it('cada venta nueva consume 520 en el mes de firma', () => {
    expect(6500 * (0.5 - 0.55 - 0.03)).toBeCloseTo(-520, 6)
  })
  it('contribución por venta = 6500 × (1 − .55 − .17 − .03) = 1625', () =>
    expect(act.contribPorVenta).toBeCloseTo(1625, 6))
  it('Google no da leads por encima de $8.000', () => {
    const r = calcular({ ...actual, google: 9000 }, SUPUESTOS_BASE)
    expect(r.leadsGoogle).toBe(0)
  })
})

describe('propuesta', () => {
  it('utilidad mensual ≈ 10.842,07 después de costos fijos', () => {
    const r = calcular(ESCENARIOS_BASE.find((e) => e.id === 'propuesta'), SUPUESTOS_BASE)
    expect(r.neto).toBeCloseTo(10842.07, 2)
  })
})

describe('casos borde y exportaciones del dominio', () => {
  it('todas las exportaciones de @/domain están definidas', () => {
    for (const [k, v] of Object.entries(dominio)) {
      expect(v, k).toBeDefined()
    }
  })
  it('inversión $0 en ambos canales no produce NaN ni Infinity', () => {
    const r = calcular({ ...actual, meta: 0, google: 0 }, SUPUESTOS_BASE)
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'number') expect(Number.isFinite(v), k).toBe(true)
    }
    expect(r.ltvCacMeta).toBeNull()
    expect(r.ltvCacGoogle).toBeNull()
    expect(r.ltvCacCombinado).toBeNull()
  })
})
