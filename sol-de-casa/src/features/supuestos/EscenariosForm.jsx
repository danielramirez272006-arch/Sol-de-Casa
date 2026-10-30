import Card from '@/shared/ui/Card.jsx'
import NumberField from '@/shared/ui/NumberField.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'

const BANDERAS = [
  ['filtro', 'Filtro'],
  ['bateria', 'Batería'],
  ['cplFijo', 'CPL fijo'],
]

export default function EscenariosForm() {
  const { escenarios, actualizarEscenario } = useModelo()
  return (
    <Card titulo="Escenarios">
      <table>
        <thead>
          <tr>
            <th>Escenario</th>
            <th>Meta</th>
            <th>Google</th>
            {BANDERAS.map(([k, label]) => (
              <th key={k}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {escenarios.map((e) => (
            <tr key={e.id}>
              <td>{e.nombre}</td>
              <td><NumberField value={e.meta} step={500} onChange={(v) => actualizarEscenario(e.id, { meta: v })} /></td>
              <td><NumberField value={e.google} step={500} onChange={(v) => actualizarEscenario(e.id, { google: v })} /></td>
              {BANDERAS.map(([k]) => (
                <td key={k}>
                  <input
                    type="checkbox"
                    checked={!!e[k]}
                    onChange={(ev) => actualizarEscenario(e.id, { [k]: ev.target.checked ? 1 : 0 })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

