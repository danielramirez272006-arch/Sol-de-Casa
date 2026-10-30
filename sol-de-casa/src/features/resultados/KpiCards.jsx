import Semaforo from '@/shared/ui/Semaforo.jsx'
import { fmtMult, fmtPct, fmtUSD, fmtVentas } from '@/shared/lib/format.js'

// Tarjetas con los números clave del escenario elegido (se recalculan en vivo).
export default function KpiCards({ r, capacidad }) {
  const kpis = [
    ['Ventas esperadas / mes', fmtVentas(r.ventas)],
    ['Utilidad tras fijos / mes', fmtUSD(r.neto)],
    ['CAC real combinado', `${fmtUSD(r.cacCombinado)} / venta`],
    ['Uso de capacidad', `${fmtPct(r.usoCapacidad)} de ${capacidad} visitas`],
    ['Caja final Mes 1', fmtUSD(r.cajaFinalMes1)],
  ]
  return (
    <div className="kpis">
      {kpis.map(([t, v]) => (
        <div key={t} className="kpi"><span>{t}</span><strong>{v}</strong></div>
      ))}
      <div className="kpi">
        <span>LTV:CAC Meta</span>
        <strong><Semaforo valor={r.ltvCacMeta}>{fmtMult(r.ltvCacMeta)}</Semaforo></strong>
      </div>
      <div className="kpi">
        <span>LTV:CAC Google</span>
        <strong><Semaforo valor={r.ltvCacGoogle}>{fmtMult(r.ltvCacGoogle)}</Semaforo></strong>
      </div>
    </div>
  )
}
