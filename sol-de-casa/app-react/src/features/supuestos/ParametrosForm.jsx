import Card from '@/shared/ui/Card.jsx'
import NumberField from '@/shared/ui/NumberField.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { fmtPct, fmtUSD } from '@/shared/lib/format.js'

// [ruta en supuestos, etiqueta, opciones]
const GRUPOS = [
  {
    titulo: 'Negocio e instalación (celdas amarillas = editables)',
    campos: [
      ['precio', 'Precio instalación', { unidad: 'USD', step: 100 }],
      ['equipos', 'Equipos / precio', { porcentaje: true }],
      ['instalacion', 'Instalación / precio', { porcentaje: true }],
      ['comision', 'Comisión de venta / precio', { porcentaje: true }],
      ['costoVisita', 'Costo por visita', { unidad: 'USD', step: 5 }],
      ['capacidad', 'Capacidad base de visitas al mes', { unidad: 'visitas', step: 10 }],
      ['tecnicosExtra', 'Técnicos extra activos (0 a 2; +50 visitas y $1.800/mes c/u)', { unidad: 'técnicos' }],
      ['cplPrometido', 'CPL Meta prometido por la agencia', { unidad: 'USD' }],
    ],
  },
  {
    titulo: 'Embudo Meta (datos CRM)',
    campos: [
      ['meta.contacto', 'Tasa de contacto', { porcentaje: true }],
      ['meta.agenda', 'Tasa de agenda', { porcentaje: true }],
      ['meta.visita', 'Visitas hechas / agendadas', { porcentaje: true }],
      ['meta.cierre', 'Tasa de cierre', { porcentaje: true }],
    ],
  },
  {
    titulo: 'Embudo Google (datos CRM)',
    campos: [
      ['google.contacto', 'Tasa de contacto', { porcentaje: true }],
      ['google.agenda', 'Tasa de agenda', { porcentaje: true }],
      ['google.visita', 'Visitas hechas / agendadas', { porcentaje: true }],
      ['google.cierre', 'Tasa de cierre', { porcentaje: true }],
    ],
  },
  {
    titulo: 'Filtro y respuesta <5 min (Supuesto 7 del caso)',
    campos: [
      ['filtro.reduccionLeads', 'Reducción de leads Meta', { porcentaje: true }],
      ['filtro.contacto', 'Contacto Meta con filtro', { porcentaje: true }],
      ['filtro.agenda', 'Agenda Meta con filtro', { porcentaje: true }],
      ['filtro.visita', 'Visita hecha Meta con filtro', { porcentaje: true }],
      ['filtro.cierre', 'Cierre Meta con filtro', { porcentaje: true }],
    ],
  },
  {
    titulo: 'Batería de respaldo (oferta proveedor)',
    campos: [
      ['bateria.precio', 'Precio batería', { unidad: 'USD', step: 100 }],
      ['bateria.margen', 'Margen bruto batería', { porcentaje: true }],
      ['bateria.comision', 'Comisión asesora sobre batería', { porcentaje: true }],
      ['bateria.adopcion', 'Adopción estimada (hipótesis: 3 de 20 = 15%)', { porcentaje: true }],
    ],
  },
  {
    titulo: 'Datos de caja',
    campos: [
      ['costosFijos', 'Costos fijos mensuales base', { unidad: 'USD', step: 500 }],
      ['cajaInicial', 'Caja inicial en banco', { unidad: 'USD', step: 500 }],
      ['pisoCaja', 'Piso mínimo de seguridad (Sofía)', { unidad: 'USD', step: 500 }],
      ['ventasMesAnterior', 'Ventas del mes 0 (septiembre)', { unidad: 'ventas' }],
    ],
  },
]

const leer = (obj, ruta) => ruta.split('.').reduce((o, k) => o[k], obj)

export default function ParametrosForm() {
  const { supuestos, efectivos, actualizarSupuesto } = useModelo()
  const margenBruto = 1 - supuestos.equipos - supuestos.instalacion
  const contribBase = supuestos.precio * (margenBruto - supuestos.comision)

  return (
    <>
      <Card titulo="Resumen derivado de costos de instalación">
        <div className="kpis">
          <div className="kpi"><span>Margen bruto (100% − equipos − instalación)</span><strong>{fmtPct(margenBruto)} ({fmtUSD(supuestos.precio * margenBruto)})</strong></div>
          <div className="kpi"><span>Contribución por instalación (antes de mkt)</span><strong>{fmtUSD(contribBase)}</strong></div>
          <div className="kpi"><span>Capacidad efectiva actual</span><strong>{efectivos.capacidad} visitas/mes</strong></div>
          <div className="kpi"><span>Costos fijos efectivos</span><strong>{fmtUSD(efectivos.costosFijos)}/mes</strong></div>
        </div>
      </Card>

      {GRUPOS.map((g) => (
        <Card key={g.titulo} titulo={g.titulo}>
          <div className="grid">
            {g.campos.map(([ruta, label, opts]) => (
              <NumberField
                key={ruta}
                label={label}
                value={leer(supuestos, ruta)}
                onChange={(v) => actualizarSupuesto(ruta, v)}
                {...opts}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card titulo="Historial del caso: leads según inversión mensual">
        <table>
          <thead>
            <tr>
              <th>Inversión mensual (USD)</th>
              <th>Leads de Meta</th>
              <th>Leads de Google</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {supuestos.curva.map((c) => (
              <tr key={c.inv}>
                <td>{fmtUSD(c.inv)}</td>
                <td>{c.meta} leads</td>
                <td>{c.google} leads</td>
                <td>{c.inv > 8000 ? 'Google se agota en 160 leads arriba de $8.000' : 'Interpolación lineal entre tramos'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
