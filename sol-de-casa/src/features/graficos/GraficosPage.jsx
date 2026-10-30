import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useState } from 'react'
import Card from '@/shared/ui/Card.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { calcularTrampa } from '@/domain'
import { fmtNum, fmtPct, fmtUSD, fmtVisitas } from '@/shared/lib/format.js'

const META = '#2563eb'
const GOOGLE = '#16a34a'
const r2 = (v) => (v == null ? 0 : Number(v.toFixed(2)))

export default function GraficosPage() {
  const { resultados, efectivos: supuestos } = useModelo()
  const [id, setId] = useState('actual')
  const esc = resultados.find((e) => e.id === id) ?? resultados[0]
  const r = esc.r
  const t = calcularTrampa(r, supuestos)

  const embudo = [
    ['Leads', r.leadsMeta, r.leadsGoogle],
    ['Contactados', r.contactadosMeta, r.contactadosGoogle],
    ['Agendadas', r.agendadasMeta, r.agendadasGoogle],
    ['Solicitadas', r.solicitadasMeta, r.solicitadasGoogle],
    ['Hechas', r.hechasMeta, r.hechasGoogle],
    ['Ventas', r.ventasMeta, r.ventasGoogle],
  ].map(([etapa, Meta, Google]) => ({ etapa, Meta: r2(Meta), Google: r2(Google) }))

  const cplVsCac = [
    { canal: 'Meta', 'CPL (USD/lead)': r2(r.cplMeta), 'CAC anuncios (USD)': r2(r.cacAnunciosMeta), 'CAC real (USD)': r2(r.cacRealMeta) },
    { canal: 'Google', 'CPL (USD/lead)': r2(r.cplGoogle), 'CAC anuncios (USD)': r2(r.cacAnunciosGoogle), 'CAC real (USD)': r2(r.cacRealGoogle) },
  ]

  const capacidad = resultados.map((e) => ({
    nombre: e.nombre,
    'Visitas solicitadas': r2(e.r.solicitadas),
    'Visitas hechas': r2(e.r.realizadas),
    'Visitas perdidas': r2(e.r.perdidas),
  }))

  const curvaHistorial = supuestos.curva.map((c) => ({
    inversion: `$${c.inv / 1000}k`,
    'Leads Meta': c.meta,
    'Leads Google': c.google,
  }))

  return (
    <>
      <Card titulo="1. La trampa a la vista: CPL frente a CAC real por canal (USD)">
        <div className="toolbar-inline">
          <label className="field" style={{ maxWidth: 280 }}>
            <span>Escenario analizado</span>
            <select value={id} onChange={(ev) => setId(ev.target.value)}>
              {resultados.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        {t.vecesMasBaratoLead && t.sobrecostoCliente != null ? (
          <p className="trampa">
            <strong>LA TRAMPA ({esc.nombre}):</strong> el lead de Meta es{' '}
            <strong>{fmtNum(t.vecesMasBaratoLead)} veces más barato</strong> ({fmtUSD(t.cplMeta)} vs. {fmtUSD(t.cplGoogle)}),
            pero el cliente cuesta{' '}
            <strong>
              {fmtPct(Math.abs(t.sobrecostoCliente))} {t.sobrecostoCliente >= 0 ? 'más' : 'menos'}
            </strong>{' '}
            (CAC real Meta {fmtUSD(t.cacMeta)} vs. Google {fmtUSD(t.cacGoogle)}).
          </p>
        ) : (
          <p className="alerta">Este escenario invierte en un solo canal; elige otro arriba para comparar ambos canales.</p>
        )}

        <ResponsiveContainer width="100%" height={310}>
          <BarChart data={cplVsCac} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="canal" />
            <YAxis unit=" $" />
            <Tooltip formatter={(v) => fmtUSD(v)} />
            <Legend />
            <Bar dataKey="CPL (USD/lead)" fill="#64748b"><LabelList dataKey="CPL (USD/lead)" position="top" /></Bar>
            <Bar dataKey="CAC anuncios (USD)" fill="#f59e0b"><LabelList dataKey="CAC anuncios (USD)" position="top" /></Bar>
            <Bar dataKey="CAC real (USD)" fill="#dc2626"><LabelList dataKey="CAC real (USD)" position="top" /></Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo={`2. Embudo completo lado a lado · ${esc.nombre}`}>
        <p className="nota" style={{ marginTop: 0 }}>
          Dónde cae más gente — <strong>Meta:</strong> {r.caidaMeta.mayorVolumen?.etapa} (−{fmtNum(r.caidaMeta.mayorVolumen?.perdidos)} personas; mayor % de caída en {r.caidaMeta.mayorPorcentaje?.destino} con {fmtPct(r.caidaMeta.mayorPorcentaje?.pctCaida)}) ·{' '}
          <strong>Google:</strong> {r.caidaGoogle.mayorVolumen?.etapa} (−{fmtNum(r.caidaGoogle.mayorVolumen?.perdidos)} personas; mayor % en {r.caidaGoogle.mayorPorcentaje?.destino} con {fmtPct(r.caidaGoogle.mayorPorcentaje?.pctCaida)}).
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={embudo} margin={{ top: 16, right: 20, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="etapa" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Meta" fill={META} />
            <Bar dataKey="Google" fill={GOOGLE} />
            <ReferenceLine y={supuestos.capacidad} stroke="#dc2626" strokeDasharray="5 5" label={`Capacidad ${supuestos.capacidad} visitas`} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo={`3. Visitas solicitadas frente a la capacidad (${supuestos.capacidad} visitas/mes)`}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={capacidad} margin={{ top: 16, right: 20, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip formatter={(v) => fmtVisitas(v)} />
            <Legend />
            <ReferenceLine y={supuestos.capacidad} stroke="#dc2626" strokeWidth={2} label={`Capacidad ${supuestos.capacidad} visitas`} />
            <Bar dataKey="Visitas solicitadas" fill="#f59e0b" />
            <Bar dataKey="Visitas hechas" fill="#16a34a" />
            <Bar dataKey="Visitas perdidas" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="4. Curva histórica: leads según inversión mensual (rendimientos decrecientes)">
        <p className="nota" style={{ marginTop: 0 }}>
          Cada $2.000 extra traen menos leads adicionales. En Google la búsqueda se agota en 160 leads a partir de $8.000/mes.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={curvaHistorial} margin={{ top: 12, right: 24, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="inversion" />
            <YAxis />
            <Tooltip />
            <Legend />
            <ReferenceLine y={160} stroke="#16a34a" strokeDasharray="4 4" label="Tope Google: 160 leads" />
            <Line type="monotone" dataKey="Leads Meta" stroke={META} strokeWidth={2} />
            <Line type="monotone" dataKey="Leads Google" stroke={GOOGLE} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  )
}
