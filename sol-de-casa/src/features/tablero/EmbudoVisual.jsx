import { fmtNum, fmtPct, fmtUSD, fmtVisitasVenta } from '@/shared/lib/format.js'

function CanalFunnel({ nombre, color, leads, contactados, agendadas, hechas, ventas, caida }) {
  const base = Math.max(leads, 1)
  const etapas = [
    ['1. Leads', leads, 1],
    ['2. Contactados', contactados, leads ? contactados / leads : 0],
    ['3. Agendan visita', agendadas, contactados ? agendadas / contactados : 0],
    ['4. Visitas hechas', hechas, agendadas ? hechas / agendadas : 0],
    ['5. Ventas cerradas', ventas, hechas ? ventas / hechas : 0],
  ]

  return (
    <div className="funnel-box">
      <div className="funnel-head">
        <strong style={{ color }}>{nombre}</strong>
        {caida?.mayorVolumen && (
          <span className="badge-caida">
            Mayor caída: {caida.mayorVolumen.etapa} (−{fmtNum(caida.mayorVolumen.perdidos)} pers.)
          </span>
        )}
      </div>
      {etapas.map(([label, val, pasoPct], idx) => {
        const ancho = Math.max(4, Math.min(100, (val / base) * 100))
        const esMayorVol = idx > 0 && caida?.mayorVolumen?.etapa.endsWith(label.slice(3).split(' ')[0])
        return (
          <div key={label} className={`funnel-row ${esMayorVol ? 'funnel-row-drop' : ''}`}>
            <div className="funnel-meta">
              <span>{label}</span>
              <span>
                <strong>{fmtNum(val)}</strong>{' '}
                <small>({idx === 0 ? '100% base' : `pasa ${fmtPct(pasoPct)}`})</small>
              </span>
            </div>
            <div className="funnel-track">
              <div className="funnel-fill" style={{ width: `${ancho}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function EmbudoVisual({ r, costoVisita }) {
  const costoVisitasPorVentaMeta = r.visitasPorVentaMeta != null ? r.visitasPorVentaMeta * costoVisita : null
  const costoVisitasPorVentaGoogle = r.visitasPorVentaGoogle != null ? r.visitasPorVentaGoogle * costoVisita : null

  return (
    <div className="charts-two-col" style={{ marginBottom: 16 }}>
      <div className="card" style={{ marginBottom: 0 }}>
        <h2>Radiografía del embudo: ¿en qué paso se cae la gente?</h2>
        <div className="funnels-stack">
          <CanalFunnel
            nombre="Canal Meta"
            color="#2563eb"
            leads={r.leadsMeta}
            contactados={r.contactadosMeta}
            agendadas={r.agendadasMeta}
            hechas={r.hechasMeta}
            ventas={r.ventasMeta}
            caida={r.caidaMeta}
          />
          <CanalFunnel
            nombre="Canal Google"
            color="#16a34a"
            leads={r.leadsGoogle}
            contactados={r.contactadosGoogle}
            agendadas={r.agendadasGoogle}
            hechas={r.hechasGoogle}
            ventas={r.ventasGoogle}
            caida={r.caidaGoogle}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h2>Anatomía del CAC real y Payback en caja por cliente</h2>
        <p className="nota" style={{ marginTop: 0 }}>
          Por qué el CPL engaña: cada visita cuesta {fmtUSD(costoVisita)} cierre o no, y el proveedor cobra los equipos el día de la firma.
        </p>

        <div className="cac-split">
          <div className="cac-card">
            <span className="cac-tag meta-tag">Cliente de Meta</span>
            <div className="cac-line"><span>Anuncios por venta</span><strong>{fmtUSD(r.cacAnunciosMeta)}</strong></div>
            <div className="cac-line">
              <span>Visitas ({fmtVisitasVenta(r.visitasPorVentaMeta)})</span>
              <strong>+ {fmtUSD(costoVisitasPorVentaMeta)}</strong>
            </div>
            <div className="cac-total"><span>CAC real Meta</span><strong>{fmtUSD(r.cacRealMeta)}</strong></div>
            <div className="payback-strip">
              <span>Caja firma: <strong className="neg">{fmtUSD(r.paybackMetaFirma)}</strong></span>
              <span>→</span>
              <span>Mes 2: <strong className="pos">{fmtUSD(r.paybackMetaSiguiente)}</strong></span>
            </div>
          </div>

          <div className="cac-card">
            <span className="cac-tag google-tag">Cliente de Google</span>
            <div className="cac-line"><span>Anuncios por venta</span><strong>{fmtUSD(r.cacAnunciosGoogle)}</strong></div>
            <div className="cac-line">
              <span>Visitas ({fmtVisitasVenta(r.visitasPorVentaGoogle)})</span>
              <strong>+ {fmtUSD(costoVisitasPorVentaGoogle)}</strong>
            </div>
            <div className="cac-total"><span>CAC real Google</span><strong>{fmtUSD(r.cacRealGoogle)}</strong></div>
            <div className="payback-strip">
              <span>Caja firma: <strong className="neg">{fmtUSD(r.paybackGoogleFirma)}</strong></span>
              <span>→</span>
              <span>Mes 2: <strong className="pos">{fmtUSD(r.paybackGoogleSiguiente)}</strong></span>
            </div>
          </div>
        </div>

        <p className="nota" style={{ marginBottom: 0, marginTop: 10 }}>
          <strong>Valor de cada visita cuando el cupo se llena:</strong> Google deja{' '}
          <strong>{fmtUSD(r.valorVisitaGoogle)}/visita</strong> frente a <strong>{fmtUSD(r.valorVisitaMeta)}/visita</strong>{' '}
          en Meta. Por eso las visitas limitadas se asignan primero a Google.
        </p>
      </div>
    </div>
  )
}
