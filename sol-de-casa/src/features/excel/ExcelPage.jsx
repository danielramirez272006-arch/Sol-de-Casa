import { useState } from 'react'
import { readSheet } from 'read-excel-file/universal'
import writeExcelFile from 'write-excel-file/universal'
import Card from '@/shared/ui/Card.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { calcular } from '@/domain/calculos'
import { compararConExcel, construirLibro, parsearSupuestos } from '@/domain/excel.js'
import { aPlan } from '@/domain/planes.js'
import { simular } from '@/domain/simulador.js'
import { ESCENARIOS_BASE } from '@/domain/escenarios.js'
import { SUPUESTOS_BASE } from '@/domain/supuestos.js'
import { fmtNum, fmtPct } from '@/shared/lib/format.js'
import { INDICADORES } from '@/features/resultados/indicadores.js'

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExcelPage() {
  const { supuestos, escenarios, resultados, planes, cargarDatos } = useModelo()
  const [informe, setInforme] = useState(null)
  const [error, setError] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)

  async function procesarArchivo(archivo) {
    if (!archivo) return
    setError('')
    try {
      const filasSup = await readSheet(archivo, 'Supuestos')
      const p = parsearSupuestos(filasSup, SUPUESTOS_BASE, ESCENARIOS_BASE)
      cargarDatos(p.supuestos, p.escenarios)

      let comparacion = null
      try {
        const filasRes = await readSheet(archivo, 'Resultados')
        const calculados = p.escenarios.map((e) => ({ nombre: e.nombre, r: calcular(e, p.supuestos) }))
        comparacion = compararConExcel(filasRes, calculados)
      } catch {
        comparacion = null
      }
      setInforme({ archivo: archivo.name, ...p, comparacion })
    } catch (e) {
      setInforme(null)
      setError(`No se pudo leer el archivo: ${e.message}. Debe ser un .xlsx con una hoja llamada "Supuestos".`)
    }
  }

  function importarInput(ev) {
    const archivo = ev.target.files?.[0]
    ev.target.value = ''
    procesarArchivo(archivo)
  }

  function soltarArchivo(ev) {
    ev.preventDefault()
    setArrastrando(false)
    const archivo = ev.dataTransfer?.files?.[0]
    procesarArchivo(archivo)
  }

  async function exportar() {
    const simulaciones = planes.map((p) => ({ nombre: p.nombre, filas: simular(aPlan(p), supuestos) }))
    const hojas = construirLibro({ supuestos, escenarios, resultados, indicadores: INDICADORES, simulaciones })
    descargar(await writeExcelFile(hojas).toBlob(), 'Sol_de_Casa_resultados.xlsx')
  }

  return (
    <>
      <Card titulo="Sincronización bidireccional con Excel / Google Sheets">
        <p style={{ marginTop: 0 }}>
          Lee y genera libros <strong>.xlsx</strong> directamente en el navegador (sin backend). Al importar tu archivo{' '}
          <code>Sol_de_Casa_Nivel_1.xlsx</code>, carga automáticamente todos los supuestos, actualiza los gráficos y audita
          que cada celda coincida con menos de <strong>1% de diferencia</strong> (requisito del Nivel 2).
        </p>

        <div
          className={`dropzone ${arrastrando ? 'dropzone-active' : ''}`}
          onDragOver={(ev) => {
            ev.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltarArchivo}
        >
          <strong>📂 Arrastra aquí tu archivo .xlsx</strong>
          <span>o selecciónalo desde tu computadora para sincronizar supuestos y verificar resultados</span>
          <div className="acciones" style={{ marginTop: 10, justifyContent: 'center' }}>
            <label className="boton">
              Seleccionar archivo .xlsx
              <input type="file" accept=".xlsx" onChange={importarInput} hidden />
            </label>
            <button type="button" onClick={exportar}>⬇ Exportar estado actual a .xlsx (3 hojas)</button>
          </div>
        </div>

        {error && <div className="alerta alerta-roja" style={{ marginTop: 12 }}>{error}</div>}
      </Card>

      {informe && (
        <Card titulo={`Auditoría de sincronización · ${informe.archivo}`}>
          <p>
            ✅ Se importaron <strong>{informe.cargados.length} parámetros y tablas</strong> desde la hoja{' '}
            <em>Supuestos</em> y todo el tablero ya se recalculó.
          </p>
          {informe.faltantes.length > 0 && (
            <div className="alerta">
              Parámetros no encontrados (se mantuvo el valor base del caso): {informe.faltantes.join(' · ')}
            </div>
          )}

          {informe.comparacion ? (
            <>
              <div className={informe.comparacion.coincide ? 'banner-ok' : 'trampa'}>
                {informe.comparacion.coincide ? '✅ COINCIDENCIA VERIFICADA (< 1%):' : '⚠ DIFERENCIA DETECTADA:'}{' '}
                <strong>{informe.comparacion.comparaciones.length} celdas auditadas</strong> contra la hoja{' '}
                <em>Resultados</em> · Diferencia máxima: <strong>{fmtNum(informe.comparacion.max * 100)}%</strong>.
              </div>

              <div className="acciones" style={{ marginTop: 10 }}>
                <button type="button" onClick={() => setVerDetalle((v) => !v)}>
                  {verDetalle ? 'Ocultar detalle celda por celda' : 'Ver auditoría celda por celda'}
                </button>
              </div>

              {verDetalle && (
                <table style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Escenario</th>
                      <th>Valor en Excel</th>
                      <th>Valor en Web</th>
                      <th>Diferencia (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.comparacion.comparaciones.map((c, idx) => (
                      <tr key={`${c.indicador}-${c.escenario}-${idx}`}>
                        <td>{c.indicador}</td>
                        <td>{c.escenario}</td>
                        <td>{fmtNum(c.excel)}</td>
                        <td>{fmtNum(c.app)}</td>
                        <td>{fmtPct(c.dif)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <p className="nota">El archivo no incluye valores calculados en una hoja llamada Resultados.</p>
          )}
        </Card>
      )}
    </>
  )
}
