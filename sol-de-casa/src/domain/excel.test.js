import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { readSheet } from 'read-excel-file/universal'
import writeExcelFile from 'write-excel-file/universal'
import { compararConExcel, construirLibro, parsearSupuestos } from './excel.js'
import { calcular } from './calculos/index.js'
import { SUPUESTOS_BASE } from './supuestos.js'
import { ESCENARIOS_BASE } from './escenarios.js'
import { PLANES_INICIALES, aPlan } from './planes.js'
import { simular } from './simulador.js'

const libro = new Blob([fs.readFileSync(new URL('../../../docs/Sol_de_Casa_Nivel_1.xlsx', import.meta.url))])
const INDICADORES = [['Ventas totales esperadas', 'ventas'], ['CAC real Meta', 'cacRealMeta']]

describe('Excel del caso', () => {
  it('importar la hoja Supuestos reproduce los supuestos base sin faltantes', async () => {
    const filas = await readSheet(libro, 'Supuestos')
    const r = parsearSupuestos(filas, SUPUESTOS_BASE, ESCENARIOS_BASE)
    expect(r.faltantes).toEqual([])
    expect(r.supuestos).toEqual(SUPUESTOS_BASE)
    expect(r.escenarios.map(({ id, meta, google, filtro, bateria, cplFijo }) => ({ id, meta, google, filtro, bateria, cplFijo })))
      .toEqual(ESCENARIOS_BASE.map(({ id, meta, google, filtro, bateria, cplFijo }) => ({ id, meta, google, filtro, bateria, cplFijo })))
  })

  it('cambiar un supuesto en el Excel cambia la app (toma el valor del archivo)', async () => {
    const filas = await readSheet(libro, 'Supuestos')
    const mod = filas.map((f) => (f[0] === 'Meta: tasa de contacto' ? [f[0], 0.5, ...f.slice(2)] : f))
    expect(parsearSupuestos(mod, SUPUESTOS_BASE, ESCENARIOS_BASE).supuestos.meta.contacto).toBe(0.5)
  })

  it('los resultados de la app coinciden con los de la hoja Resultados (<1 %)', async () => {
    const filas = await readSheet(libro, 'Resultados')
    const resultados = ESCENARIOS_BASE.map((e) => ({ nombre: e.nombre, r: calcular(e, SUPUESTOS_BASE) }))
    const c = compararConExcel(filas, resultados)
    const peor = [...c.comparaciones].sort((a, b) => b.dif - a.dif).slice(0, 3)
    expect(c.comparaciones.length).toBeGreaterThan(50)
    expect(c.max, JSON.stringify(peor)).toBeLessThan(0.01)
  })

  it('el libro exportado se puede abrir y reimportar sin perder datos', async () => {
    const resultados = ESCENARIOS_BASE.map((e) => ({ ...e, r: calcular(e, SUPUESTOS_BASE) }))
    const simulaciones = PLANES_INICIALES.map((p) => ({ nombre: p.nombre, filas: simular(aPlan(p), SUPUESTOS_BASE) }))
    const hojas = construirLibro({ supuestos: SUPUESTOS_BASE, escenarios: ESCENARIOS_BASE, resultados, indicadores: INDICADORES, simulaciones })
    const blob = await writeExcelFile(hojas).toBlob()
    expect(blob.size).toBeGreaterThan(1000)
    const filas = await readSheet(blob, 'Supuestos')
    const r = parsearSupuestos(filas, { ...SUPUESTOS_BASE, precio: 1 }, ESCENARIOS_BASE)
    expect(r.faltantes).toEqual([])
    expect(r.supuestos.precio).toBe(6500)
    expect(r.supuestos.curva).toEqual(SUPUESTOS_BASE.curva)
  })
})

