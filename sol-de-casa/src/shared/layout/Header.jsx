import writeExcelFile from 'write-excel-file/universal'
import { useModelo } from '@/app/ModeloContext.jsx'
import { construirLibro } from '@/domain/excel.js'
import { aPlan } from '@/domain/planes.js'
import { simular } from '@/domain/simulador.js'
import { INDICADORES } from '@/features/resultados/indicadores.js'

export default function Header({ onReiniciar }) {
  const { supuestos, escenarios, resultados, planes } = useModelo()

  async function descargarExcelRapido() {
    const simulaciones = planes.map((p) => ({ nombre: p.nombre, filas: simular(aPlan(p), supuestos) }))
    const hojas = construirLibro({ supuestos, escenarios, resultados, indicadores: INDICADORES, simulaciones })
    const blob = await writeExcelFile(hojas).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Sol_de_Casa_resultados.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="header">
      <div>
        <div className="header-badges">
          <span className="pill-badge">CASO C · LEAD GEN SOLAR</span>
          <span className="pill-badge pill-ok">Nivel 1 · 2 · 3 Completos</span>
          <span className="pill-badge pill-sync">Excel .xlsx Sincronizado</span>
        </div>
        <h1>☀ Sol de Casa — Modelo Financiero y Simulador</h1>
        <p>
          Decisión recomendada: <strong>No pasar todo a Meta</strong> · El cliente de Meta cuesta <strong>34,10% más</strong> que el de Google ($718,13 vs. $535,54)
        </p>
      </div>
      <div className="header-actions">
        <button type="button" className="btn-secondary-dark" onClick={descargarExcelRapido}>
          ⬇ Descargar .xlsx
        </button>
        <button type="button" onClick={onReiniciar}>
          ↺ Volver a los datos del caso
        </button>
      </div>
    </header>
  )
}
