import { useMemo, useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { PLANES_INICIALES, aPlan } from '@/domain/planes.js'
import Card from '@/shared/ui/Card.jsx'
import NumberField from '@/shared/ui/NumberField.jsx'
import { useModelo } from '@/app/ModeloContext.jsx'
import { MESES, detalleMes1, resumirPlan, simular } from '@/domain/simulador.js'
import { fmtLeads, fmtNum, fmtUSD, fmtVentas, fmtVisitas } from '@/shared/lib/format.js'

const COLORES = ['#2563eb', '#dc2626', '#16a34a', '#7c3aed', '#d97706']

function Mes1({ supuestos: S }) {
  const d = detalleMes1(S)
  const { leads: l, emb: e } = d
  const filas = [
    ['Leads Meta / Google', `${fmtNum(l.meta)} / ${fmtNum(l.google)} leads`, 'Curva histórica ($4.000 en cada canal → 500 y 100 leads)'],
    ['Contactados Meta / Google', `${fmtNum(e.contactadosMeta)} / ${fmtNum(e.contactadosGoogle)} pers.`, '500 × 55% = 275 en Meta · 100 × 85% = 85 en Google'],
    ['Visitas agendadas Meta / Google', `${fmtNum(e.agendadasMeta)} / ${fmtNum(e.agendadasGoogle)} visitas`, '275 × 30% = 82,5 en Meta · 85 × 55% = 46,75 en Google'],
    ['Visitas pedidas Meta / Google', `${fmtNum(e.solicitadasMeta)} / ${fmtNum(e.solicitadasGoogle)} visitas`, '82,5 × 70% = 57,75 en Meta · 46,75 × 85% = 39,74 en Google'],
    ['Visitas hechas totales', fmtVisitas(e.realizadas), `57,75 + 39,7375 = 97,49 visitas (dentro de capacidad de ${S.capacidad})`],
    ['Ventas cerradas Meta / Google / Total', `${fmtNum(e.ventasMeta)} / ${fmtNum(e.ventasGoogle)} (${fmtVentas(e.ventas)})`, '57,75 × 18% = 10,395 Meta · 39,7375 × 30% = 11,92125 Google'],
    ['Entradas: 50% ventas del Mes 1', fmtUSD(d.entradasMes), `50% × ${fmtUSD(S.precio)} × ${fmtNum(e.ventas)} ventas`],
    ['Entradas: 50% ventas del Mes 0 (sept.)', fmtUSD(d.entradasPrev), `50% × ${fmtUSD(S.precio)} × ${S.ventasMesAnterior} ventas del mes anterior`],
    ['Total entradas Mes 1', fmtUSD(d.entradas), `${fmtUSD(d.entradasMes)} + ${fmtUSD(d.entradasPrev)}`],
    ['Salida: equipos (55% ventas Mes 1)', fmtUSD(d.equipos), `55% × ${fmtUSD(S.precio)} × ${fmtNum(e.ventas)} ventas`],
    ['Salida: comisión (3% ventas Mes 1)', fmtUSD(d.comision), `3% × ${fmtUSD(S.precio)} × ${fmtNum(e.ventas)} ventas`],
    ['Salida: instalación (17% ventas Mes 0)', fmtUSD(d.instalacion), `17% × ${fmtUSD(S.precio)} × ${S.ventasMesAnterior} ventas`],
    ['Salida: visitas técnicas hechas', fmtUSD(d.visitas), `${fmtNum(e.realizadas)} visitas × ${fmtUSD(S.costoVisita)}`],
    ['Salida: anuncios Meta + Google', fmtUSD(8000), '$4.000 Meta + $4.000 Google'],
    ['Salida: costos fijos mensuales', fmtUSD(S.costosFijos), 'Sueldos base, oficina, bodega, camioneta y CRM'],
    ['Total salidas Mes 1', fmtUSD(d.salidas), 'Suma de todas las salidas del mes'],
    ['Caja final Mes 1 = Inicial + Entradas − Salidas', fmtUSD(d.cajaFinal), `${fmtUSD(S.cajaInicial)} + ${fmtUSD(d.entradas)} − ${fmtUSD(d.salidas)}`],
  ]
  return (
    <table>
      <thead>
        <tr>
          <th>Cuenta verificada</th>
          <th>Valor (con unidad)</th>
          <th style={{ textAlign: 'left' }}>Cuenta escrita paso a paso</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([a, b, c]) => (
          <tr key={a}>
            <td>{a}</td>
            <td><strong>{b}</strong></td>
            <td style={{ textAlign: 'left' }}>{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Pitch({ plan, supuestos }) {
  const { res } = plan
  const tecnicos = [plan.tecnico1, plan.tecnico2].filter((m) => m > 0)
  const describeInversion =
    plan.escalaDesde > 0
      ? `${fmtUSD(plan.meta)} Meta + ${fmtUSD(plan.google)} Google al inicio, escalando desde el mes ${plan.escalaDesde} a ${fmtUSD(plan.metaFase2)} Meta + ${fmtUSD(plan.googleFase2)} Google (cuando los técnicos ya están capacitados)`
      : `${fmtUSD(plan.meta)} en Meta y ${fmtUSD(plan.google)} en Google fijos cada mes`

  return (
    <ul>
      <li><strong>Cuánto invertir en cada canal:</strong> {describeInversion}. Nunca se reduce la inversión después del mes 19.</li>
      <li>
        <strong>Cuándo contratar y operar:</strong>{' '}
        {tecnicos.length ? `contratar técnicos extra en los meses ${tecnicos.join(' y ')} (se pagan desde ese mes y suman +50 visitas al siguiente)` : 'sin técnicos extra'}
        ; filtro y respuesta en &lt;5 min {plan.filtroDesde > 0 ? `activos desde el mes ${plan.filtroDesde}` : 'no activados'}.
      </li>
      <li>
        <strong>Resultado a 24 meses:</strong> termina con <strong>{fmtUSD(res.cajaMes24)}</strong> en banco y{' '}
        <strong>{fmtVentas(res.instalaciones)}</strong> acumuladas. La caja mínima es{' '}
        <strong>{fmtUSD(res.cajaMinima)}</strong> en el mes {res.mesCajaMinima} ({res.respetaPiso ? 'siempre sobre el' : 'POR DEBAJO del'} piso de {fmtUSD(supuestos.pisoCaja)}).
      </li>
      <li>
        <strong>Riesgo principal y mitigación:</strong> los meses 2–3 concentran el pago al contado de equipos y la
        capacitación de técnicos antes de cobrar el segundo 50%; además, el resultado depende de validar en el mes 1 el
        efecto del filtro en Meta. Un crédito de capital de trabajo cubre el descalce de 30 días con el proveedor.
      </li>
      <li>
        <strong>Qué tendría que pasar para crecer más:</strong> negociar pago a 30 días con el proveedor de paneles,
        ampliar más allá de 2 técnicos/cuadrillas y abrir referidos o mantenimiento (Google se agota en 160 leads sobre $8.000).
      </li>
    </ul>
  )
}

export default function SimuladorPage() {
  const { supuestos, planes, setPlanes } = useModelo()
  const [sel, setSel] = useState('p4')
  const [editarMesAMes, setEditarMesAMes] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const sims = useMemo(
    () =>
      planes.map((p) => {
        const filas = simular(aPlan(p), supuestos)
        return { ...p, filas, res: resumirPlan(filas, supuestos) }
      }),
    [planes, supuestos],
  )
  const actualizar = (id, cambios) => setPlanes((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
  const elegido = sims.find((s) => s.id === sel) ?? sims[0]
  const planActual = sims[0]

  const cambiarInversionMes = (mesIdx, canal, valor) => {
    const base = elegido.mesesCustom
      ? elegido.mesesCustom.map((x) => ({ ...x }))
      : elegido.filas.map((f) => ({ meta: f.meta, google: f.google }))
    base[mesIdx] = { ...base[mesIdx], [canal]: Math.max(0, valor) }
    actualizar(elegido.id, { mesesCustom: base })
  }

  const copiarPitch = async () => {
    const { res } = elegido
    const texto = [
      `Plan ${elegido.nombre} (24 meses — Sol de Casa):`,
      `- Caja final mes 24: ${fmtUSD(res.cajaMes24)} | Instalaciones: ${fmtNum(res.instalaciones)}`,
      `- Caja mínima: ${fmtUSD(res.cajaMinima)} (mes ${res.mesCajaMinima}) vs. piso de ${fmtUSD(supuestos.pisoCaja)}`,
      `- Reglas del reto: ${res.cumpleReglas ? 'Cumple piso de $5.000 y regla del mes 19' : 'Revisar alertas'}`,
    ].join('\n')
    await navigator.clipboard?.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const dataCaja = Array.from({ length: MESES }, (_, i) => ({
    mes: i + 1,
    ...Object.fromEntries(sims.map((s) => [s.nombre, Math.round(s.filas[i].caja)])),
  }))

  const deltaCaja = elegido.res.cajaMes24 - planActual.res.cajaMes24
  const deltaInst = elegido.res.instalaciones - planActual.res.instalaciones

  return (
    <>
      <Card titulo={`Resumen ejecutivo · ${elegido.nombre}`}>
        <div className="kpis">
          <div className="kpi"><span>Caja al mes 24</span><strong>{fmtUSD(elegido.res.cajaMes24)}</strong></div>
          <div className="kpi">
            <span>Mejora vs. Plan Actual</span>
            <strong className={deltaCaja >= 0 ? 'pos' : 'neg'}>
              {deltaCaja >= 0 ? '+' : ''}{fmtUSD(deltaCaja)}
            </strong>
          </div>
          <div className="kpi">
            <span>Instalaciones en 24 meses</span>
            <strong>{fmtVentas(elegido.res.instalaciones)} ({deltaInst >= 0 ? '+' : ''}{fmtNum(deltaInst)})</strong>
          </div>
          <div className="kpi">
            <span>Caja mínima y mes crítico</span>
            <strong>{fmtUSD(elegido.res.cajaMinima)} (mes {elegido.res.mesCajaMinima})</strong>
          </div>
          <div className="kpi">
            <span>Cumplimiento de reglas</span>
            <strong>{elegido.res.cumpleReglas ? '✅ Piso $5k y Mes 19 OK' : '⛔ Rompe regla'}</strong>
          </div>
        </div>
      </Card>

      <Card titulo="Comparación de planes a 24 meses (Nivel 3)">
        <div className="alerta">
          <strong>Nota de sensibilidad y reglas:</strong> en los caminos en 2 fases (Propios B y C) se cuida la caja en
          los meses 1–2 mientras se capacitan los 2 técnicos extra, y en el <strong>mes 3</strong> (ya con 200 visitas de
          capacidad) se escala la inversión sin volver a bajarla. Si el filtro no mejora las tasas de Meta, escalar sin
          validar antes rompería el piso de {fmtUSD(supuestos.pisoCaja)}.
        </div>

        <div className="acciones" style={{ marginBottom: 10 }}>
          <button type="button" onClick={() => setPlanes(PLANES_INICIALES)}>↺ Restaurar planes recomendados</button>
        </div>

        <p className="nota">
          Haz clic en el nombre de cualquier plan para ver abajo su pitch, su curva de capacidad y sus 24 filas mes a mes.
          «Escala mes» = 0 mantiene inversión fija; &gt;0 cambia a Meta/Google Fase 2 desde ese mes.
        </p>

        <table>
          <thead>
            <tr>
              <th>Plan (clic para detallar)</th>
              <th>Meta inicial (USD)</th>
              <th>Google inicial (USD)</th>
              <th>Escala mes</th>
              <th>Meta Fase 2 (USD)</th>
              <th>Google Fase 2 (USD)</th>
              <th>Filtro mes</th>
              <th>Téc. 1</th>
              <th>Téc. 2</th>
              <th>Caja mínima (mes)</th>
              <th>Caja mes 24</th>
              <th>Instalaciones</th>
              <th>Reglas</th>
            </tr>
          </thead>
          <tbody>
            {sims.map((s) => (
              <tr key={s.id} className={s.id === elegido.id ? 'sel' : ''}>
                <td><button type="button" onClick={() => setSel(s.id)}>{s.nombre}</button></td>
                <td><NumberField value={s.meta} step={500} onChange={(v) => actualizar(s.id, { meta: v })} /></td>
                <td><NumberField value={s.google} step={500} onChange={(v) => actualizar(s.id, { google: v })} /></td>
                <td><NumberField value={s.escalaDesde ?? 0} onChange={(v) => actualizar(s.id, { escalaDesde: v })} /></td>
                <td><NumberField value={s.metaFase2 ?? s.meta} step={500} onChange={(v) => actualizar(s.id, { metaFase2: v })} /></td>
                <td><NumberField value={s.googleFase2 ?? s.google} step={500} onChange={(v) => actualizar(s.id, { googleFase2: v })} /></td>
                <td><NumberField value={s.filtroDesde} onChange={(v) => actualizar(s.id, { filtroDesde: v })} /></td>
                <td><NumberField value={s.tecnico1} onChange={(v) => actualizar(s.id, { tecnico1: v })} /></td>
                <td><NumberField value={s.tecnico2} onChange={(v) => actualizar(s.id, { tecnico2: v })} /></td>
                <td>{fmtUSD(s.res.cajaMinima)} <small>(mes {s.res.mesCajaMinima})</small></td>
                <td><strong>{fmtUSD(s.res.cajaMes24)}</strong></td>
                <td>{fmtNum(s.res.instalaciones)}</td>
                <td>{s.res.cumpleReglas ? '✅ Cumple' : !s.res.respetaPiso ? '⛔ Baja de $5k' : '⛔ Baja tras mes 19'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card titulo={`Pitch de 2 minutos ante el banco · ${elegido.nombre}`}>
        <div className="acciones no-print" style={{ marginBottom: 8 }}>
          <button type="button" onClick={copiarPitch}>
            {copiado ? '✅ Resumen copiado al portapapeles' : '📋 Copiar resumen numérico del pitch'}
          </button>
        </div>
        <Pitch plan={elegido} supuestos={supuestos} />
      </Card>

      <Card titulo="Revisión manual del Mes 1 · Plan Actual ($4.000 Meta + $4.000 Google, sin técnicos extra)">
        <Mes1 supuestos={supuestos} />
      </Card>

      <Card titulo={`Caja al final de cada mes (USD) · Línea roja = piso de ${fmtUSD(supuestos.pisoCaja)}`}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={dataCaja} margin={{ top: 12, right: 20, left: 12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(v) => fmtUSD(v)} />
            <Legend />
            <ReferenceLine y={supuestos.pisoCaja} stroke="#dc2626" strokeWidth={2} label={`Piso ${fmtUSD(supuestos.pisoCaja)}`} />
            {sims.map((s, i) => (
              <Line key={s.id} type="monotone" dataKey={s.nombre} stroke={COLORES[i % COLORES.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo={`Visitas pedidas frente a capacidad mes a mes · ${elegido.nombre}`}>
        <ResponsiveContainer width="100%" height={290}>
          <LineChart data={elegido.filas} margin={{ top: 12, right: 20, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(v) => fmtVisitas(v)} />
            <Legend />
            <Line dataKey="pedidas" name="Visitas pedidas" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line dataKey="hechas" name="Visitas hechas" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line dataKey="capacidad" name="Capacidad máxima" stroke="#dc2626" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo={`Tabla de 24 meses · ${elegido.nombre}`}>
        <div className="acciones no-print" style={{ marginBottom: 10 }}>
          <label className="toggle-pill">
            <input type="checkbox" checked={editarMesAMes} onChange={(e) => setEditarMesAMes(e.target.checked)} />
            <span>Editar inversión mes a mes manualmente (permite probar caminos personalizados y la regla del mes 19)</span>
          </label>
          {elegido.mesesCustom && (
            <button type="button" onClick={() => actualizar(elegido.id, { mesesCustom: undefined })}>
              Quitar edición manual de este plan
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th>Meta (USD)</th>
              <th>Google (USD)</th>
              <th>Leads</th>
              <th>Visitas pedidas</th>
              <th>Capacidad</th>
              <th>Visitas hechas</th>
              <th>Ventas</th>
              <th>Entradas (USD)</th>
              <th>Salidas (USD)</th>
              <th>Caja final (USD)</th>
              <th>Estado caja</th>
            </tr>
          </thead>
          <tbody>
            {elegido.filas.map((f, idx) => (
              <tr key={f.mes} className={f.alerta ? 'fila-alerta' : ''}>
                <td>Mes {f.mes}{f.mes >= 19 ? ' 🔒' : ''}</td>
                <td>
                  {editarMesAMes ? (
                    <NumberField value={f.meta} step={500} onChange={(v) => cambiarInversionMes(idx, 'meta', v)} />
                  ) : (
                    fmtUSD(f.meta)
                  )}
                </td>
                <td>
                  {editarMesAMes ? (
                    <NumberField value={f.google} step={500} onChange={(v) => cambiarInversionMes(idx, 'google', v)} />
                  ) : (
                    fmtUSD(f.google)
                  )}
                </td>
                <td>{fmtLeads(f.leads)}</td>
                <td>{fmtVisitas(f.pedidas)}</td>
                <td>{f.capacidad} visitas</td>
                <td>{fmtVisitas(f.hechas)}</td>
                <td>{fmtVentas(f.ventas)}</td>
                <td>{fmtUSD(f.entradas)}</td>
                <td>{fmtUSD(f.salidas)}</td>
                <td><strong>{fmtUSD(f.caja)}</strong></td>
                <td>{f.alerta ? '⛔ Bajo $5.000' : '✅ OK'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
