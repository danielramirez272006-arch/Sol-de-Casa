import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import Card from '@/shared/ui/Card.jsx'
import SliderField from '@/shared/ui/SliderField.jsx'
import Semaforo from '@/shared/ui/Semaforo.jsx'
import EmbudoVisual from './EmbudoVisual.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { calcular, calcularTrampa } from '@/domain'
import {
  fmtLeads, fmtMult, fmtNum, fmtPct, fmtUSD, fmtVentas, fmtVisitas, fmtVisitasVenta,
} from '@/shared/lib/format.js'

const PRESETS = [
  { label: 'Hoy ($4k / $4k)', meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 },
  { label: 'Agencia: historial ($8k / $0)', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 0 },
  { label: 'Agencia: promesa ($8 CPL)', meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 1 },
  { label: 'Propuesta: Filtro + Batería', meta: 4000, google: 4000, filtro: 1, bateria: 1, cplFijo: 0 },
]

const r2 = (v) => (v == null ? 0 : Number(v.toFixed(2)))

export default function TableroPage() {
  const { supuestos, efectivos, actualizarSupuesto, reiniciar } = useModelo()
  const [esc, setEsc] = useState({ meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 })

  const r = calcular(esc, supuestos)
  const t = calcularTrampa(r, efectivos)
  const margenBruto = Math.max(0, 1 - supuestos.equipos - supuestos.instalacion)

  const cambiarMargenBruto = (nuevoMargen) => {
    const nuevoEquipos = Math.max(0, Math.min(0.95, 1 - supuestos.instalacion - nuevoMargen))
    actualizarSupuesto('equipos', Number(nuevoEquipos.toFixed(4)))
  }

  const volverAlCaso = () => {
    reiniciar()
    setEsc({ meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 })
  }

  const embudoChart = [
    ['Leads', r.leadsMeta, r.leadsGoogle],
    ['Contactados', r.contactadosMeta, r.contactadosGoogle],
    ['Agendadas', r.agendadasMeta, r.agendadasGoogle],
    ['Pedidas', r.solicitadasMeta, r.solicitadasGoogle],
    ['Hechas', r.hechasMeta, r.hechasGoogle],
    ['Ventas', r.ventasMeta, r.ventasGoogle],
  ].map(([etapa, Meta, Google]) => ({ etapa, Meta: r2(Meta), Google: r2(Google) }))

  const cplVsCac = [
    { canal: 'Meta', 'CPL (USD/lead)': r2(r.cplMeta), 'CAC anuncios (USD)': r2(r.cacAnunciosMeta), 'CAC real (USD)': r2(r.cacRealMeta) },
    { canal: 'Google', 'CPL (USD/lead)': r2(r.cplGoogle), 'CAC anuncios (USD)': r2(r.cacAnunciosGoogle), 'CAC real (USD)': r2(r.cacRealGoogle) },
  ]

  const capChart = [
    {
      grupo: 'Visitas del mes',
      'Pedidas Google': r2(r.solicitadasGoogle),
      'Pedidas Meta': r2(r.solicitadasMeta),
      'Hechas totales': r2(r.realizadas),
      'Perdidas por tope': r2(r.perdidas),
    },
  ]

  const tasasMeta = esc.filtro ? supuestos.filtro : supuestos.meta
  const prefijoMeta = esc.filtro ? 'filtro' : 'meta'

  return (
    <>
      {r.perdidas > 0.005 && (
        <div className="alerta alerta-fuerte">
          <strong>⚠ Alerta de capacidad superada:</strong> se piden <strong>{fmtVisitas(r.solicitadas)}</strong> para una
          capacidad máxima de <strong>{fmtVisitas(efectivos.capacidad)}</strong>. Se prioriza Google y se pierden{' '}
          <strong>{fmtVisitas(r.perdidas)}</strong> de Meta. Prueba sumar un técnico extra abajo.
        </div>
      )}
      {!r.sobrePisoCaja && (
        <div className="alerta alerta-roja">
          <strong>⛔ Alerta de caja:</strong> la caja final del mes 1 ({fmtUSD(r.cajaFinalMes1)}) cae debajo del piso de
          seguridad de Sofía ({fmtUSD(efectivos.pisoCaja)}).
        </div>
      )}

      <Card titulo="Controles en vivo del tablero (Nivel 2)">
        <div className="preset-bar">
          <span className="preset-title">Escenarios rápidos:</span>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => setEsc({ meta: p.meta, google: p.google, filtro: p.filtro, bateria: p.bateria, cplFijo: p.cplFijo })}>
              {p.label}
            </button>
          ))}
          <button type="button" className="btn-reset" onClick={volverAlCaso}>
            ↺ Volver a los datos del caso
          </button>
        </div>

        <div className="toggles-row">
          <label className="toggle-pill">
            <input type="checkbox" checked={!!esc.filtro} onChange={(e) => setEsc((s) => ({ ...s, filtro: e.target.checked ? 1 : 0 }))} />
            <span>Activar respuesta &lt;5 min + filtro en Meta (−20% leads, mejores tasas)</span>
          </label>
          <label className="toggle-pill">
            <input type="checkbox" checked={!!esc.bateria} onChange={(e) => setEsc((s) => ({ ...s, bateria: e.target.checked ? 1 : 0 }))} />
            <span>Ofrecer batería de respaldo ({fmtUSD(supuestos.bateria.precio)})</span>
          </label>
          <label className="toggle-pill">
            <input type="checkbox" checked={!!esc.cplFijo} onChange={(e) => setEsc((s) => ({ ...s, cplFijo: e.target.checked ? 1 : 0 }))} />
            <span>Simular promesa agencia (CPL Meta fijo {fmtUSD(supuestos.cplPrometido)})</span>
          </label>
        </div>

        <div className="controles-grid">
          <div className="control-box">
            <h3>1. Presupuesto y capacidad</h3>
            <SliderField label="Inversión Meta" value={esc.meta} min={0} max={10000} step={250} unidad="USD/mes" onChange={(v) => setEsc((s) => ({ ...s, meta: v }))} />
            <SliderField label="Inversión Google (tope 160 leads en $8k)" value={esc.google} min={0} max={8000} step={250} unidad="USD/mes" onChange={(v) => setEsc((s) => ({ ...s, google: v }))} />
            <SliderField label="Costo por visita técnica" value={supuestos.costoVisita} min={0} max={150} step={5} unidad="USD/visita" onChange={(v) => actualizarSupuesto('costoVisita', v)} />
            <SliderField label="Capacidad base (2 técnicos)" value={supuestos.capacidad} min={40} max={200} step={10} unidad="visitas/mes" onChange={(v) => actualizarSupuesto('capacidad', v)} />
            <SliderField label="Técnicos extra (+50 visitas y $1.800/mes c/u)" value={supuestos.tecnicosExtra} min={0} max={2} step={1} unidad="técnicos" onChange={(v) => actualizarSupuesto('tecnicosExtra', v)} />
          </div>

          <div className="control-box">
            <h3>2. Economía por venta y batería</h3>
            <SliderField label="Precio instalación" value={supuestos.precio} min={4000} max={10000} step={100} unidad="USD" onChange={(v) => actualizarSupuesto('precio', v)} />
            <SliderField
              label="Margen bruto instalación"
              value={margenBruto}
              min={0.1}
              max={0.5}
              step={0.01}
              porcentaje
              ayuda={`Equipos ${fmtPct(supuestos.equipos)} + Instalación ${fmtPct(supuestos.instalacion)}`}
              onChange={cambiarMargenBruto}
            />
            <SliderField label="Comisión asesora" value={supuestos.comision} min={0} max={0.1} step={0.005} porcentaje onChange={(v) => actualizarSupuesto('comision', v)} />
            <SliderField label="Clientes que agregan batería" value={supuestos.bateria.adopcion} min={0} max={0.6} step={0.01} porcentaje ayuda={esc.bateria ? 'Activa en este escenario' : 'Activa la casilla de batería arriba para sumarla'} onChange={(v) => actualizarSupuesto('bateria.adopcion', v)} />
          </div>

          <div className="control-box">
            <h3>3. Embudo Meta {esc.filtro ? '(con filtro)' : '(actual)'}</h3>
            <SliderField label="Contacto Meta" value={tasasMeta.contacto} min={0.1} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto(`${prefijoMeta}.contacto`, v)} />
            <SliderField label="Agenda Meta" value={tasasMeta.agenda} min={0.05} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto(`${prefijoMeta}.agenda`, v)} />
            <SliderField label="Visitas hechas Meta" value={tasasMeta.visita} min={0.1} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto(`${prefijoMeta}.visita`, v)} />
            <SliderField label="Cierre Meta" value={tasasMeta.cierre} min={0.05} max={0.6} step={0.01} porcentaje onChange={(v) => actualizarSupuesto(`${prefijoMeta}.cierre`, v)} />
          </div>

          <div className="control-box">
            <h3>4. Embudo Google</h3>
            <SliderField label="Contacto Google" value={supuestos.google.contacto} min={0.1} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto('google.contacto', v)} />
            <SliderField label="Agenda Google" value={supuestos.google.agenda} min={0.05} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto('google.agenda', v)} />
            <SliderField label="Visitas hechas Google" value={supuestos.google.visita} min={0.1} max={1} step={0.01} porcentaje onChange={(v) => actualizarSupuesto('google.visita', v)} />
            <SliderField label="Cierre Google" value={supuestos.google.cierre} min={0.05} max={0.6} step={0.01} porcentaje onChange={(v) => actualizarSupuesto('google.cierre', v)} />
          </div>
        </div>
      </Card>

      <Card titulo="Resultados en vivo: por canal y en total">
        <div className="kpis" style={{ marginBottom: 14 }}>
          <div className="kpi"><span>Leads totales</span><strong>{fmtLeads(r.leadsTotales)}</strong></div>
          <div className="kpi"><span>Visitas usadas vs. capacidad</span><strong>{fmtNum(r.realizadas)} / {efectivos.capacidad} visitas ({fmtPct(r.usoCapacidad)})</strong></div>
          <div className="kpi"><span>Ventas cerradas</span><strong>{fmtVentas(r.ventas)}</strong></div>
          <div className="kpi"><span>CAC real combinado</span><strong>{fmtUSD(r.cacCombinado)} / cliente</strong></div>
          <div className="kpi"><span>LTV:CAC Meta / Google</span><strong><Semaforo valor={r.ltvCacMeta}>{fmtMult(r.ltvCacMeta)}</Semaforo> · <Semaforo valor={r.ltvCacGoogle}>{fmtMult(r.ltvCacGoogle)}</Semaforo></strong></div>
          <div className="kpi"><span>Utilidad tras costos fijos</span><strong>{fmtUSD(r.neto)} / mes</strong></div>
          <div className="kpi"><span>Caja final Mes 1</span><strong>{fmtUSD(r.cajaFinalMes1)}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Métrica (con unidad)</th>
              <th>Meta</th>
              <th>Google</th>
              <th>Total / Combinado</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Inversión en anuncios (USD/mes)</td><td>{fmtUSD(esc.meta)}</td><td>{fmtUSD(esc.google)}</td><td><strong>{fmtUSD(r.anuncios)}</strong></td></tr>
            <tr><td>Leads generados (leads/mes)</td><td>{fmtLeads(r.leadsMeta)}</td><td>{fmtLeads(r.leadsGoogle)}</td><td><strong>{fmtLeads(r.leadsTotales)}</strong></td></tr>
            <tr><td>Contactados (personas/mes)</td><td>{fmtNum(r.contactadosMeta)} pers.</td><td>{fmtNum(r.contactadosGoogle)} pers.</td><td>{fmtNum(r.contactadosTotales)} pers.</td></tr>
            <tr><td>Visitas agendadas (visitas/mes)</td><td>{fmtVisitas(r.agendadasMeta)}</td><td>{fmtVisitas(r.agendadasGoogle)}</td><td>{fmtVisitas(r.agendadasTotales)}</td></tr>
            <tr><td>Visitas pedidas (visitas/mes)</td><td>{fmtVisitas(r.solicitadasMeta)}</td><td>{fmtVisitas(r.solicitadasGoogle)}</td><td>{fmtVisitas(r.solicitadas)}</td></tr>
            <tr><td>Visitas realizadas vs. capacidad ({efectivos.capacidad} visitas)</td><td>{fmtVisitas(r.hechasMeta)}</td><td>{fmtVisitas(r.hechasGoogle)}</td><td><strong>{fmtVisitas(r.realizadas)} ({fmtPct(r.usoCapacidad)})</strong></td></tr>
            <tr><td>Visitas perdidas por falta de capacidad</td><td>{fmtVisitas(r.perdidas)}</td><td>0 visitas</td><td>{fmtVisitas(r.perdidas)}</td></tr>
            <tr><td>Ventas cerradas (instalaciones/mes)</td><td>{fmtVentas(r.ventasMeta)}</td><td>{fmtVentas(r.ventasGoogle)}</td><td><strong>{fmtVentas(r.ventas)}</strong></td></tr>
            <tr><td>Visitas necesarias por venta</td><td>{fmtVisitasVenta(r.visitasPorVentaMeta)}</td><td>{fmtVisitasVenta(r.visitasPorVentaGoogle)}</td><td>{fmtVisitasVenta(r.visitasPorVentaCombinado)}</td></tr>
            <tr><td>CPL · Costo por lead (USD/lead)</td><td>{fmtUSD(r.cplMeta)}</td><td>{fmtUSD(r.cplGoogle)}</td><td>{fmtUSD(r.cplCombinado)}</td></tr>
            <tr><td>CAC solo anuncios (USD/cliente)</td><td>{fmtUSD(r.cacAnunciosMeta)}</td><td>{fmtUSD(r.cacAnunciosGoogle)}</td><td>{fmtUSD(r.cacAnunciosCombinado)}</td></tr>
            <tr><td><strong>CAC real: anuncios + visitas (USD/cliente)</strong></td><td><strong>{fmtUSD(r.cacRealMeta)}</strong></td><td><strong>{fmtUSD(r.cacRealGoogle)}</strong></td><td><strong>{fmtUSD(r.cacCombinado)}</strong></td></tr>
            <tr>
              <td>LTV:CAC (veces que devuelve el CAC real)</td>
              <td><Semaforo valor={r.ltvCacMeta}>{fmtMult(r.ltvCacMeta)}</Semaforo></td>
              <td><Semaforo valor={r.ltvCacGoogle}>{fmtMult(r.ltvCacGoogle)}</Semaforo></td>
              <td><Semaforo valor={r.ltvCacCombinado}>{fmtMult(r.ltvCacCombinado)}</Semaforo></td>
            </tr>
            <tr><td>Valor esperado de una visita (USD/visita)</td><td>{fmtUSD(r.valorVisitaMeta)}</td><td>{fmtUSD(r.valorVisitaGoogle)}</td><td>{fmtUSD(r.valorVisitaCombinado)}</td></tr>
            <tr><td>Contribución media por venta (USD/venta)</td><td>{fmtUSD(r.contribPorVenta)}</td><td>{fmtUSD(r.contribPorVenta)}</td><td>{fmtUSD(r.contribPorVenta)}</td></tr>
            <tr><td>Payback en caja del cliente</td><td>{r.paybackMesMeta ?? '—'} ({fmtUSD(r.paybackMetaSiguiente)} acum.)</td><td>{r.paybackMesGoogle ?? '—'} ({fmtUSD(r.paybackGoogleSiguiente)} acum.)</td><td>Mes 2 (instalación)</td></tr>
            <tr>
              <td>Paso donde se cae más gente (personas / %)</td>
              <td>{r.caidaMeta.mayorVolumen ? `${r.caidaMeta.mayorVolumen.etapa} (−${fmtNum(r.caidaMeta.mayorVolumen.perdidos)} pers. | máx %: ${fmtPct(r.caidaMeta.mayorPorcentaje.pctCaida)} en ${r.caidaMeta.mayorPorcentaje.destino})` : '—'}</td>
              <td>{r.caidaGoogle.mayorVolumen ? `${r.caidaGoogle.mayorVolumen.etapa} (−${fmtNum(r.caidaGoogle.mayorVolumen.perdidos)} pers. | máx %: ${fmtPct(r.caidaGoogle.mayorPorcentaje.pctCaida)} en ${r.caidaGoogle.mayorPorcentaje.destino})` : '—'}</td>
              <td>Priorizar Google al llenar cupo</td>
            </tr>
          </tbody>
        </table>
        <p className="nota">
          Semáforo LTV:CAC (umbral propio justificado): <Semaforo valor={3.2}>≥ 3,0x saludable</Semaforo>{' '}
          <Semaforo valor={2}>1,0x – 2,99x ajustado</Semaforo> <Semaforo valor={0.8}>&lt; 1,0x pierde dinero</Semaforo>
        </p>
      </Card>

      <EmbudoVisual r={r} costoVisita={efectivos.costoVisita} />

      <div className="charts-two-col">
        <Card titulo="Gráfico 1 · La trampa: CPL vs. CAC real por canal (USD)">
          {t.vecesMasBaratoLead && t.sobrecostoCliente != null ? (
            <div className="trampa" style={{ marginBottom: 12 }}>
              <strong>LA TRAMPA A LA VISTA:</strong> el lead de Meta es{' '}
              <strong>{fmtNum(t.vecesMasBaratoLead)} veces más barato</strong> ({fmtUSD(t.cplMeta)} vs. {fmtUSD(t.cplGoogle)}),
              pero el cliente cuesta{' '}
              <strong>
                {fmtPct(Math.abs(t.sobrecostoCliente))} {t.sobrecostoCliente >= 0 ? 'más' : 'menos'}
              </strong>{' '}
              ({fmtUSD(t.cacMeta)} vs. {fmtUSD(t.cacGoogle)}).
            </div>
          ) : (
            <div className="alerta">Activa inversión en ambos canales para comparar la trampa lado a lado.</div>
          )}
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={cplVsCac} margin={{ top: 20, right: 16, left: 8, bottom: 5 }}>
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

        <Card titulo="Gráfico 2 · Embudo lado a lado y caída por etapa">
          <p className="nota" style={{ marginTop: 0 }}>
            Mayor pérdida en Meta: <strong>{r.caidaMeta.mayorVolumen?.etapa}</strong> (−{fmtNum(r.caidaMeta.mayorVolumen?.perdidos)} pers.).
            En Google: <strong>{r.caidaGoogle.mayorVolumen?.etapa}</strong> (−{fmtNum(r.caidaGoogle.mayorVolumen?.perdidos)} pers.).
          </p>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={embudoChart} margin={{ top: 16, right: 16, left: 4, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etapa" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Meta" fill="#2563eb" />
              <Bar dataKey="Google" fill="#16a34a" />
              <ReferenceLine y={efectivos.capacidad} stroke="#dc2626" strokeDasharray="5 5" label={`Capacidad ${efectivos.capacidad} visitas`} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card titulo={`Gráfico 3 · Visitas pedidas frente a capacidad (${efectivos.capacidad} visitas/mes)`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={capChart} margin={{ top: 20, right: 24, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grupo" />
            <YAxis />
            <Tooltip formatter={(v) => fmtVisitas(v)} />
            <Legend />
            <ReferenceLine y={efectivos.capacidad} stroke="#dc2626" strokeWidth={2} label={`Límite capacidad: ${efectivos.capacidad} visitas`} />
            <Bar dataKey="Pedidas Google" stackId="pedidas" fill="#16a34a" />
            <Bar dataKey="Pedidas Meta" stackId="pedidas" fill="#60a5fa" />
            <Bar dataKey="Hechas totales" fill="#0f766e"><LabelList dataKey="Hechas totales" position="top" /></Bar>
            <Bar dataKey="Perdidas por tope" fill="#dc2626"><LabelList dataKey="Perdidas por tope" position="top" /></Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  )
}

