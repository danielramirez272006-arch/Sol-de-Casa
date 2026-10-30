import Card from '@/shared/ui/Card.jsx'
import { fmtNum, fmtPct, fmtUSD, fmtVentas, fmtVisitas } from '@/shared/lib/format.js'
import { useModelo } from '@/app/ModeloContext.jsx'
import { calcularTrampa } from '@/domain/trampa.js'

export default function RecomendacionPage() {
  const { resultados, efectivos: supuestos } = useModelo()
  const get = (id) => resultados.find((e) => e.id === id)?.r
  const actual = get('actual')
  const agHist = get('agHist')
  const agProm = get('agPromesa')
  const prop = get('propuesta')
  const filtro = get('filtro')
  const t = calcularTrampa(actual, supuestos)

  const drenajeFirma = -supuestos.precio * (0.5 - supuestos.equipos - supuestos.comision)

  return (
    <>
      <Card titulo="Recomendación ejecutiva para Andrés (1 página)">
        <div className="acciones no-print" style={{ marginBottom: 12 }}>
          <button type="button" onClick={() => window.print()}>🖨 Imprimir / Guardar como PDF (1 página)</button>
        </div>

        <p>
          <strong>Decisión: rechazar la propuesta de Leadly</strong> de pasar todo el presupuesto a Meta. Recomendamos
          mantener <strong>{fmtUSD(4000)} en Meta y {fmtUSD(4000)} en Google</strong> mientras se implementan dos mejoras
          operativas inmediatas.
        </p>

        <p className="trampa">
          <strong>La trampa del caso:</strong> el lead de Meta cuesta{' '}
          <strong>{fmtNum(t.vecesMasBaratoLead)} veces menos</strong> ({fmtUSD(t.cplMeta)} vs. {fmtUSD(t.cplGoogle)}), pero
          convierte peor y exige {fmtNum(actual.visitasPorVentaMeta)} visitas por venta frente a{' '}
          {fmtNum(actual.visitasPorVentaGoogle)} en Google. Al sumar anuncios y visitas,{' '}
          <strong>un cliente en Meta cuesta {fmtPct(t.sobrecostoCliente)} más</strong>: CAC real{' '}
          <strong>{fmtUSD(t.cacMeta)}</strong> frente a <strong>{fmtUSD(t.cacGoogle)}</strong> en Google.
        </p>

        <table>
          <thead>
            <tr>
              <th>Indicador mensual</th>
              <th>Hoy ($4k/$4k)</th>
              <th>Agencia: historial</th>
              <th>Agencia: promesa</th>
              <th>Cambio 1: Filtro</th>
              <th>Propuesta: Filtro + Batería</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Visitas solicitadas</td>
              <td>{fmtVisitas(actual.solicitadas)}</td>
              <td>{fmtVisitas(agHist.solicitadas)}</td>
              <td>{fmtVisitas(agProm.solicitadas)}</td>
              <td>{fmtVisitas(filtro.solicitadas)}</td>
              <td>{fmtVisitas(prop.solicitadas)}</td>
            </tr>
            <tr>
              <td>Visitas perdidas por tope ({supuestos.capacidad})</td>
              <td>{fmtVisitas(actual.perdidas)}</td>
              <td>{fmtVisitas(agHist.perdidas)}</td>
              <td>{fmtVisitas(agProm.perdidas)}</td>
              <td>{fmtVisitas(filtro.perdidas)}</td>
              <td>{fmtVisitas(prop.perdidas)}</td>
            </tr>
            <tr>
              <td><strong>Ventas cerradas</strong></td>
              <td><strong>{fmtVentas(actual.ventas)}</strong></td>
              <td><strong>{fmtVentas(agHist.ventas)}</strong></td>
              <td><strong>{fmtVentas(agProm.ventas)}</strong></td>
              <td><strong>{fmtVentas(filtro.ventas)}</strong></td>
              <td><strong>{fmtVentas(prop.ventas)}</strong></td>
            </tr>
            <tr>
              <td>CAC real combinado (USD/venta)</td>
              <td>{fmtUSD(actual.cacCombinado)}</td>
              <td>{fmtUSD(agHist.cacCombinado)}</td>
              <td>{fmtUSD(agProm.cacCombinado)}</td>
              <td>{fmtUSD(filtro.cacCombinado)}</td>
              <td>{fmtUSD(prop.cacCombinado)}</td>
            </tr>
            <tr>
              <td><strong>Utilidad tras costos fijos</strong></td>
              <td><strong>{fmtUSD(actual.neto)}</strong></td>
              <td><strong>{fmtUSD(agHist.neto)}</strong></td>
              <td><strong>{fmtUSD(agProm.neto)}</strong></td>
              <td><strong>{fmtUSD(filtro.neto)}</strong></td>
              <td><strong>{fmtUSD(prop.neto)}</strong></td>
            </tr>
            <tr>
              <td>Caja final Mes 1 (sin batería)</td>
              <td>{fmtUSD(actual.cajaFinalMes1)}</td>
              <td>{fmtUSD(agHist.cajaFinalMes1)}</td>
              <td>{fmtUSD(agProm.cajaFinalMes1)}</td>
              <td>{fmtUSD(filtro.cajaFinalMes1)}</td>
              <td>{fmtUSD(prop.cajaFinalMes1)}</td>
            </tr>
          </tbody>
        </table>

        <ul>
          <li>
            <strong>Por qué falla la agencia:</strong> incluso con su promesa irreal ($8/lead = 1.000 leads), el tope de{' '}
            {supuestos.capacidad} visitas frena las ventas en {fmtVentas(agProm.ventas)}. Con el historial real ($8.000
            traen 840 leads), caen a {fmtVentas(agHist.ventas)} y el negocio pierde <strong>{fmtUSD(Math.abs(agHist.neto))}/mes</strong>.
          </li>
          <li>
            <strong>Cambio 1 · Respuesta &lt;5 min + 2 preguntas filtro en Meta:</strong> sube las ventas a{' '}
            <strong>{fmtVentas(filtro.ventas)}</strong> y eleva la utilidad neta de {fmtUSD(actual.neto)} a{' '}
            <strong>{fmtUSD(filtro.neto)}</strong> (+{fmtUSD(filtro.neto - actual.neto)}/mes). Al llenarse el cupo, se
            prioriza Google ({fmtUSD(actual.valorVisitaGoogle)}/visita vs. {fmtUSD(filtro.valorVisitaMeta)}/visita en Meta).
          </li>
          <li>
            <strong>Cambio 2 · Ofrecer la batería de respaldo ($3.000) en la visita:</strong> deja $510 netos por batería
            vendida; con 15% de adopción esperada suma +{fmtUSD(prop.neto - filtro.neto)}/mes sin gasto extra de marketing,
            llevando la utilidad neta a <strong>{fmtUSD(prop.neto)}/mes</strong>.
          </li>
        </ul>
      </Card>

      <Card titulo="Alerta para Sofía: Caja del Mes 1 vs. Utilidad">
        <p>
          Con nuestra propuesta la utilidad mensual sube a <strong>{fmtUSD(prop.neto)}</strong>, pero la caja del Mes 1 es
          menor ({fmtUSD(actual.cajaFinalMes1)} hoy → <strong>{fmtUSD(prop.cajaFinalMes1)}</strong>, siempre sobre el piso
          de {fmtUSD(supuestos.pisoCaja)}). Esto ocurre porque cada venta nueva consume{' '}
          <strong>{fmtUSD(drenajeFirma)} netos en el mes de la firma</strong> (entra 50% de anticipo, pero salen 55% de
          equipos al contado y 3% de comisión) y recién se recupera en el <strong>Mes 2 (instalación)</strong> cuando entra
          el segundo 50% menos 17% de cuadrilla (+{fmtUSD(supuestos.precio * (0.5 - supuestos.instalacion))}).
        </p>
      </Card>

      <div className="charts-two-col">
        <Card titulo="Supuestos del caso utilizados (pág. 6)">
          <ul>
            <li><strong>1. LTV de una sola venta:</strong> sin recompra, mantenimiento ni referidos en Sesión 1.</li>
            <li><strong>2. Embudo en el mismo mes:</strong> contacto, agenda, visita y firma ocurren dentro del mes.</li>
            <li><strong>3. Tasas del embudo constantes:</strong> no varían al cambiar el monto invertido.</li>
            <li><strong>4. Prioridad de capacidad:</strong> primero Google (mayor cierre y valor/visita) y luego Meta; el resto se pierde.</li>
            <li><strong>5. Interpolación lineal:</strong> recta entre puntos históricos (desde $0 = 0 leads; tope de 160 en Google sobre $8k).</li>
            <li><strong>6. Doble cálculo agencia:</strong> promesa ($8 CPL fijo) comparada frente al historial real.</li>
            <li><strong>7. Cambio filtro + &lt;5 min:</strong> −20% leads en Meta y tasas 80% / 40% / 75% / 22% (supuesto de casos similares, requiere validación).</li>
          </ul>
        </Card>

        <Card titulo="Supuestos propios del equipo y riesgos">
          <ul>
            <li><strong>Adopción de batería = 15% sobre ventas:</strong> hipótesis tomada del piloto (3 de 20 visitas). Muestra pequeña; por eso se presenta separado del Cambio 1.</li>
            <li><strong>Batería excluida de la caja:</strong> el caso no define plazos de cobro al cliente ni pago al proveedor de la batería; no se infla la caja de Sofía.</li>
            <li><strong>Costo inicial de respuesta &lt;5 min = $0:</strong> reorganización de alertas/horarios antes de sumar personal.</li>
            <li><strong>Semáforo LTV:CAC:</strong> verde ≥ 3,0x · amarillo 1,0x–2,99x · rojo &lt; 1,0x.</li>
            <li><strong>Riesgo principal:</strong> si el filtro no mejora las tasas o el cierre cae 20%, escalar inversión rápido puede apretar la caja en el mes 3.</li>
          </ul>
        </Card>
      </div>

      <Card titulo="Filas verificadas a mano (con la cuenta escrita)">
        <ul>
          <li>
            <strong>CAC real de Meta hoy:</strong> ({fmtUSD(4000)} anuncios + {fmtNum(actual.hechasMeta)} visitas ×{' '}
            {fmtUSD(supuestos.costoVisita)}) ÷ {fmtNum(actual.ventasMeta)} ventas = ($4.000 + $3.465) ÷ 10,395 ={' '}
            <strong>{fmtUSD(actual.cacRealMeta)} por cliente</strong>.
          </li>
          <li>
            <strong>CAC real de Google hoy:</strong> ({fmtUSD(4000)} anuncios + {fmtNum(actual.hechasGoogle)} visitas ×{' '}
            {fmtUSD(supuestos.costoVisita)}) ÷ {fmtNum(actual.ventasGoogle)} ventas = ($4.000 + $2.384,25) ÷ 11,92125 ={' '}
            <strong>{fmtUSD(actual.cacRealGoogle)} por cliente</strong>.
          </li>
        </ul>
      </Card>

      <Card titulo="En qué se equivocó o nos confundió la IA (obligatorio)">
        <ul>
          <li>
            <strong>1. Omitió el CAC de anuncios de Google en la hoja inicial:</strong> calculó el de Meta ($384,80) y los
            CAC reales, pero olvidó la fila del CAC solo anuncios de Google. <em>Por qué estaba mal:</em> impedía ver que
            incluso antes de sumar visitas, Google ya es más barato por venta en anuncios puros ({fmtUSD(actual.cacAnunciosGoogle)} vs.{' '}
            {fmtUSD(actual.cacAnunciosMeta)}). <em>Corrección:</em> agregamos la fila y verificamos $4.000 ÷ 11,92125 ={' '}
            {fmtUSD(actual.cacAnunciosGoogle)}.
          </li>
          <li>
            <strong>2. Usó el mismo tope de $10.000 para Google que para Meta en la primera versión web:</strong>{' '}
            <em>Por qué estaba mal:</em> el caso establece rango $0–$8.000 en Google porque arriba de $8.000 se agotan las
            búsquedas en 160 leads. <em>Corrección:</em> separamos los topes por canal y añadimos un test automático.
          </li>
          <li>
            <strong>3. Espejismo de la caja del Mes 1 en el plan de la agencia ({fmtUSD(agHist.cajaFinalMes1)}):</strong>{' '}
            parece mejor caja que hoy ({fmtUSD(actual.cajaFinalMes1)}), pero solo porque vende menos instalaciones nuevas y
            paga menos equipos al contado ese primer mes; al simular 24 meses hunde la caja a −$60.898.
          </li>
        </ul>
      </Card>
    </>
  )
}
