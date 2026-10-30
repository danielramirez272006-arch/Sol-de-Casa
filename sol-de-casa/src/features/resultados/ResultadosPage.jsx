import { useState } from 'react'
import Card from '@/shared/ui/Card.jsx'
import Semaforo from '@/shared/ui/Semaforo.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { fmtNum } from '@/shared/lib/format.js'
import KpiCards from './KpiCards.jsx'
import { INDICADORES } from './indicadores.js'

export default function ResultadosPage() {
  const { resultados, efectivos: supuestos } = useModelo()
  const [id, setId] = useState('actual')
  const elegido = resultados.find((e) => e.id === id)
  const sobrecupo = resultados.filter((e) => e.r.perdidas > 0.005)
  const bajoPiso = resultados.filter((e) => !e.r.sobrePisoCaja)

  return (
    <>
      {sobrecupo.map((e) => (
        <div key={e.id} className="alerta">
          ⚠ {e.nombre}: se piden {fmtNum(e.r.solicitadas)} visitas y la capacidad es {supuestos.capacidad}.
          Se pierden {fmtNum(e.r.perdidas)} (Google tiene prioridad).
        </div>
      ))}
      {bajoPiso.map((e) => (
        <div key={e.id} className="alerta">
          ⚠ {e.nombre}: la caja final del mes 1 queda bajo el piso de seguridad.
        </div>
      ))}
      <Card titulo="Resumen en vivo">
        <label className="field" style={{ maxWidth: 260, marginBottom: 12 }}>
          <span>Escenario</span>
          <select value={id} onChange={(ev) => setId(ev.target.value)}>
            {resultados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        <KpiCards r={elegido.r} capacidad={supuestos.capacidad} />
      </Card>
      <Card titulo="Resultados por escenario">
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              {resultados.map((e) => (
                <th key={e.id}>{e.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INDICADORES.map(([label, key, fmt]) => (
              <tr key={key}>
                <td>{label}</td>
                {resultados.map((e) => (
                  <td key={e.id}>
                    {key.startsWith('ltvCac') ? <Semaforo valor={e.r[key]}>{fmt(e.r[key])}</Semaforo> : fmt(e.r[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="nota">
          Semáforo LTV:CAC (umbrales supuestos): verde ≥ 3 · amarillo entre 1 y 3 · rojo &lt; 1.
        </p>
      </Card>
    </>
  )
}
