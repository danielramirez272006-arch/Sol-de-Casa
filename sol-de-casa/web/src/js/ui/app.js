// Controlador interactivo principal de Sol de Casa (Vanilla JS)
;(function () {
  const M = window.SolDeCasa
  const C = window.SolCharts

  const state = {
    supuestos: M.clonar(M.SUPUESTOS_BASE),
    escenarios: M.clonar(M.ESCENARIOS_BASE),
    planes: M.clonar(M.PLANES_INICIALES),
    tableroEsc: { meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 },
    planSel: 'p4',
    editarMesAMes: false,
    informeExcel: null,
    verDetalleExcel: false,
  }

  const SLIDER_SPECS = [
    // Grupo 1: Presupuesto y capacidad
    { group: 'ctrl-presupuesto', key: 'esc.meta', label: 'Inversión Meta', min: 0, max: 10000, step: 250, unit: 'USD/mes' },
    { group: 'ctrl-presupuesto', key: 'esc.google', label: 'Inversión Google (tope $8k)', min: 0, max: 8000, step: 250, unit: 'USD/mes' },
    { group: 'ctrl-presupuesto', key: 'sup.costoVisita', label: 'Costo por visita técnica', min: 0, max: 150, step: 5, unit: 'USD' },
    { group: 'ctrl-presupuesto', key: 'sup.capacidad', label: 'Capacidad base (2 técnicos)', min: 40, max: 200, step: 10, unit: 'visitas' },
    { group: 'ctrl-presupuesto', key: 'sup.tecnicosExtra', label: 'Técnicos extra (+50 vis. / $1,8k)', min: 0, max: 2, step: 1, unit: 'técnicos' },
    // Grupo 2: Economía unitaria
    { group: 'ctrl-economia', key: 'sup.precio', label: 'Precio instalación', min: 4000, max: 10000, step: 100, unit: 'USD' },
    { group: 'ctrl-economia', key: 'derived.margenBruto', label: 'Margen bruto instalación', min: 10, max: 50, step: 1, pct: true },
    { group: 'ctrl-economia', key: 'sup.comision', label: 'Comisión asesora', min: 0, max: 10, step: 0.5, pct: true },
    { group: 'ctrl-economia', key: 'sup.bateria.adopcion', label: 'Adopción de batería', min: 0, max: 60, step: 1, pct: true },
    // Grupo 3: Embudo Meta
    { group: 'ctrl-meta', key: 'metaDynamic.contacto', label: 'Tasa de contacto Meta', min: 10, max: 100, step: 1, pct: true },
    { group: 'ctrl-meta', key: 'metaDynamic.agenda', label: 'Tasa de agenda Meta', min: 5, max: 100, step: 1, pct: true },
    { group: 'ctrl-meta', key: 'metaDynamic.visita', label: 'Asistencia visita Meta', min: 10, max: 100, step: 1, pct: true },
    { group: 'ctrl-meta', key: 'metaDynamic.cierre', label: 'Tasa de cierre Meta', min: 5, max: 60, step: 1, pct: true },
    // Grupo 4: Embudo Google
    { group: 'ctrl-google', key: 'sup.google.contacto', label: 'Tasa de contacto Google', min: 10, max: 100, step: 1, pct: true },
    { group: 'ctrl-google', key: 'sup.google.agenda', label: 'Tasa de agenda Google', min: 5, max: 100, step: 1, pct: true },
    { group: 'ctrl-google', key: 'sup.google.visita', label: 'Asistencia visita Google', min: 10, max: 100, step: 1, pct: true },
    { group: 'ctrl-google', key: 'sup.google.cierre', label: 'Tasa de cierre Google', min: 5, max: 60, step: 1, pct: true },
  ]

  function getSliderValue(spec) {
    if (spec.key.startsWith('esc.')) return state.tableroEsc[spec.key.slice(4)]
    if (spec.key === 'derived.margenBruto') {
      return Math.round((1 - state.supuestos.equipos - state.supuestos.instalacion) * 1000) / 10
    }
    if (spec.key.startsWith('metaDynamic.')) {
      const sub = spec.key.slice(12)
      const branch = state.tableroEsc.filtro ? state.supuestos.filtro : state.supuestos.meta
      return Math.round(branch[sub] * 1000) / 10
    }
    const ruta = spec.key.slice(4)
    const raw = M.leerRuta(state.supuestos, ruta)
    return spec.pct ? Math.round(raw * 1000) / 10 : raw
  }

  function setSliderValue(spec, val) {
    const clamped = Math.min(spec.max, Math.max(spec.min, val))
    if (spec.key.startsWith('esc.')) {
      state.tableroEsc[spec.key.slice(4)] = clamped
    } else if (spec.key === 'derived.margenBruto') {
      const nuevoMargen = clamped / 100
      const nuevoEquipos = Math.max(0, Math.min(0.95, 1 - state.supuestos.instalacion - nuevoMargen))
      state.supuestos = M.asignarRuta(state.supuestos, 'equipos', Number(nuevoEquipos.toFixed(4)))
    } else if (spec.key.startsWith('metaDynamic.')) {
      const sub = spec.key.slice(12)
      const pref = state.tableroEsc.filtro ? 'filtro' : 'meta'
      state.supuestos = M.asignarRuta(state.supuestos, `${pref}.${sub}`, Number((clamped / 100).toFixed(4)))
    } else {
      const ruta = spec.key.slice(4)
      state.supuestos = M.asignarRuta(state.supuestos, ruta, spec.pct ? Number((clamped / 100).toFixed(4)) : clamped)
    }
    renderAll({ keepSlidersFocus: true })
  }

  function buildSlidersDOM() {
    const groups = ['ctrl-presupuesto', 'ctrl-economia', 'ctrl-meta', 'ctrl-google']
    groups.forEach((gid) => {
      const box = document.getElementById(gid)
      if (!box) return
      const specs = SLIDER_SPECS.filter((s) => s.group === gid)
      box.innerHTML = specs
        .map(
          (s, idx) => `
        <div class="space-y-1.5" data-slider-key="${s.key}">
          <div class="flex items-center justify-between gap-2">
            <label class="ui-label text-[#10201F]" for="rng-${gid}-${idx}">${s.label}</label>
            <div class="flex items-center gap-1.5">
              <input id="num-${gid}-${idx}" type="number" min="${s.min}" max="${s.max}" step="${s.step}" class="solar-num-input w-20" data-input-key="${s.key}" />
              <span class="ui-micro text-[#647A78]">${s.pct ? '%' : s.unit || ''}</span>
            </div>
          </div>
          <input id="rng-${gid}-${idx}" type="range" min="${s.min}" max="${s.max}" step="${s.step}" class="solar-range" data-range-key="${s.key}" />
        </div>
      `,
        )
        .join('')
    })

    SLIDER_SPECS.forEach((spec) => {
      const rng = document.querySelector(`[data-range-key="${spec.key}"]`)
      const num = document.querySelector(`[data-input-key="${spec.key}"]`)
      if (rng) {
        rng.addEventListener('input', (e) => {
          const v = Number(e.target.value)
          if (num) num.value = String(v)
          setSliderValue(spec, v)
        })
      }
      if (num) {
        num.addEventListener('change', (e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) setSliderValue(spec, v)
        })
      }
    })
  }

  function syncSlidersValues() {
    const metaTitle = document.getElementById('ctrl-meta-heading')
    if (metaTitle) {
      metaTitle.textContent = state.tableroEsc.filtro ? '03 · Embudo Meta (con filtro)' : '03 · Embudo Meta (actual)'
    }
    SLIDER_SPECS.forEach((spec) => {
      const val = getSliderValue(spec)
      const rng = document.querySelector(`[data-range-key="${spec.key}"]`)
      const num = document.querySelector(`[data-input-key="${spec.key}"]`)
      if (rng && document.activeElement !== rng) rng.value = String(val)
      if (num && document.activeElement !== num) num.value = String(val)
    })
    const chkFiltro = document.getElementById('chk-tablero-filtro')
    const chkBat = document.getElementById('chk-tablero-bateria')
    const chkCpl = document.getElementById('chk-tablero-cpl')
    if (chkFiltro) chkFiltro.checked = !!state.tableroEsc.filtro
    if (chkBat) chkBat.checked = !!state.tableroEsc.bateria
    if (chkCpl) chkCpl.checked = !!state.tableroEsc.cplFijo
  }

  function renderEmbudoRadiografia(r, costoVisita) {
    const container = document.getElementById('embudo-visual-container')
    if (!container) return

    function canalHtml(nombre, accent, leads, contactados, agendadas, hechas, ventas, caida) {
      const base = Math.max(leads, 1)
      const etapas = [
        ['1. Leads captados', 'Leads', leads, 1],
        ['2. Contactados', 'Contactados', contactados, leads ? contactados / leads : 0],
        ['3. Agendan visita', 'Agendadas', agendadas, contactados ? agendadas / contactados : 0],
        ['4. Visitas hechas', 'Hechas', hechas, agendadas ? hechas / agendadas : 0],
        ['5. Ventas cerradas', 'Ventas', ventas, hechas ? ventas / hechas : 0],
      ]
      return `
        <div class="panel-compact p-4 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="ui-label font-semibold" style="color:${accent}">${nombre}</span>
            ${
              caida && caida.mayorVolumen
                ? `<span class="ui-micro px-2.5 py-1 rounded-full bg-[#D98A2B]/15 text-[#8A5210] border border-[#D98A2B]/30">Mayor caída: ${caida.mayorVolumen.etapa} (−${M.fmt.num(caida.mayorVolumen.perdidos)})</span>`
                : ''
            }
          </div>
          ${etapas
            .map(([label, dest, val, pct], idx) => {
              const width = Math.max(4, Math.min(100, (val / base) * 100))
              const drop = idx > 0 && caida && caida.mayorVolumen && caida.mayorVolumen.destino === dest
              return `
              <div class="rounded-xl px-2.5 py-1.5 ${drop ? 'bg-[#A63D33]/8 border border-[#A63D33]/25' : ''}">
                <div class="flex justify-between items-baseline text-xs mb-1">
                  <span class="ui-label text-[#10201F]">${label}</span>
                  <span class="text-[#425856]"><strong class="text-[#10201F]">${M.fmt.num(val)}</strong> · ${idx === 0 ? '100% base' : `pasa ${M.fmt.pct(pct)}`}</span>
                </div>
                <div class="h-2 rounded-full bg-[#10201F]/10 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" style="width:${width.toFixed(1)}%;background:${drop ? '#D98A2B' : accent}"></div>
                </div>
              </div>`
            })
            .join('')}
        </div>
      `
    }

    const visMetaUSD = r.visitasPorVentaMeta != null ? r.visitasPorVentaMeta * costoVisita : null
    const visGoogleUSD = r.visitasPorVentaGoogle != null ? r.visitasPorVentaGoogle * costoVisita : null

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7 card-glass p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-editorial text-2xl text-[#10201F]">Radiografía del <em>embudo</em> paso a paso</h3>
            <span class="ui-micro text-[#647A78]">Detección de fugas</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${canalHtml('Canal Meta', '#2F6F73', r.leadsMeta, r.contactadosMeta, r.agendadasMeta, r.hechasMeta, r.ventasMeta, r.caidaMeta)}
            ${canalHtml('Canal Google', '#8C6D3F', r.leadsGoogle, r.contactadosGoogle, r.agendadasGoogle, r.hechasGoogle, r.ventasGoogle, r.caidaGoogle)}
          </div>
        </div>

        <div class="lg:col-span-5 card-glass p-6 flex flex-col justify-between space-y-4">
          <div>
            <span class="ui-micro text-[#2F6F73]">Economía de adquisición</span>
            <h3 class="font-editorial text-2xl text-[#10201F] mt-1">Anatomía del CAC <em>real</em> y Payback</h3>
            <p class="text-sm text-[#425856] mt-1">Cada visita técnica cuesta ${M.fmt.usd(costoVisita)} cierre o no, y el proveedor cobra el 55% de equipos el día de la firma.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="panel-compact p-4 space-y-2">
              <span class="ui-micro text-[#2F6F73]">Cliente Meta</span>
              <div class="flex justify-between text-sm"><span>Anuncios</span><strong>${M.fmt.usd(r.cacAnunciosMeta)}</strong></div>
              <div class="flex justify-between text-sm"><span>Visitas (${M.fmt.num(r.visitasPorVentaMeta)})</span><strong>+${M.fmt.usd(visMetaUSD)}</strong></div>
              <div class="pt-2 border-t border-[#10201F]/15 flex justify-between text-base">
                <span class="font-medium">CAC real</span><strong class="text-[#10201F]">${M.fmt.usd(r.cacRealMeta)}</strong>
              </div>
              <div class="text-xs text-[#425856] pt-1">
                Firma: <strong class="text-[#A63D33]">${M.fmt.usd(r.paybackMetaFirma)}</strong> → Mes 2: <strong class="text-[#2F6F73]">${M.fmt.usd(r.paybackMetaSiguiente)}</strong>
              </div>
            </div>

            <div class="panel-compact p-4 space-y-2">
              <span class="ui-micro text-[#8C6D3F]">Cliente Google</span>
              <div class="flex justify-between text-sm"><span>Anuncios</span><strong>${M.fmt.usd(r.cacAnunciosGoogle)}</strong></div>
              <div class="flex justify-between text-sm"><span>Visitas (${M.fmt.num(r.visitasPorVentaGoogle)})</span><strong>+${M.fmt.usd(visGoogleUSD)}</strong></div>
              <div class="pt-2 border-t border-[#10201F]/15 flex justify-between text-base">
                <span class="font-medium">CAC real</span><strong class="text-[#2F6F73]">${M.fmt.usd(r.cacRealGoogle)}</strong>
              </div>
              <div class="text-xs text-[#425856] pt-1">
                Firma: <strong class="text-[#A63D33]">${M.fmt.usd(r.paybackGoogleFirma)}</strong> → Mes 2: <strong class="text-[#2F6F73]">${M.fmt.usd(r.paybackGoogleSiguiente)}</strong>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-[#D9C7A6]/35 border border-[#D9C7A6] px-4 py-3 text-sm text-[#10201F]">
            <strong>Prioridad de agenda:</strong> una visita de Google deja <strong>${M.fmt.usd(r.valorVisitaGoogle)}</strong> frente a <strong>${M.fmt.usd(r.valorVisitaMeta)}</strong> en Meta. Al llenarse el cupo, Google siempre entra primero.
          </div>
        </div>
      </div>
    `
  }

  function renderTableroSection(efectivos) {
    const esc = state.tableroEsc
    const r = M.calcular(esc, state.supuestos)
    const t = M.calcularTrampa(r, efectivos)

    // Alertas dinámicas
    const alertBox = document.getElementById('tablero-alerts')
    if (alertBox) {
      let html = ''
      if (r.perdidas > 0.005) {
        html += `<div class="rounded-2xl border border-[#D98A2B]/45 bg-[#D98A2B]/15 px-5 py-3.5 text-sm text-[#10201F]">
          <strong class="ui-label text-[#8A5210]">⚠ Capacidad superada:</strong> se solicitan <strong>${M.fmt.visitas(r.solicitadas)}</strong> para un tope de <strong>${M.fmt.visitas(efectivos.capacidad)}</strong>. Se prioriza Google y se pierden <strong>${M.fmt.visitas(r.perdidas)}</strong> de Meta.
        </div>`
      }
      if (!r.sobrePisoCaja) {
        html += `<div class="rounded-2xl border border-[#A63D33]/40 bg-[#A63D33]/12 px-5 py-3.5 text-sm text-[#10201F]">
          <strong class="ui-label text-[#8C2B22]">⛔ Alerta de caja (Sofía):</strong> la caja final del Mes 1 (<strong>${M.fmt.usd(r.cajaFinalMes1)}</strong>) cae por debajo del piso mínimo de seguridad (${M.fmt.usd(efectivos.pisoCaja)}).
        </div>`
      }
      alertBox.innerHTML = html
    }

    // KPIs en vivo del tablero
    const kpisEl = document.getElementById('tablero-kpis')
    if (kpisEl) {
      const firstPass = !kpisEl.dataset.hydrated
      kpisEl.dataset.hydrated = '1'
      const stagAttr = firstPass ? ' data-stagger-item' : ''
      const cards = [
        ['Leads totales', M.fmt.leads(r.leadsTotales), `${M.fmt.num(r.leadsMeta)} Meta · ${M.fmt.num(r.leadsGoogle)} Google`],
        ['Capacidad utilizada', `${M.fmt.num(r.realizadas)} / ${efectivos.capacidad}`, `${M.fmt.pct(r.usoCapacidad)} del cupo mensual`],
        ['Ventas cerradas', M.fmt.ventas(r.ventas), `${M.fmt.num(r.ventasMeta)} Meta · ${M.fmt.num(r.ventasGoogle)} Google`],
        ['CAC real combinado', M.fmt.usd(r.cacCombinado), 'Anuncios + visitas técnicas'],
        ['Utilidad neta / mes', M.fmt.usd(r.neto), `Tras ${M.fmt.usd(efectivos.costosFijos)} de costos fijos`],
        ['Caja final Mes 1', M.fmt.usd(r.cajaFinalMes1), `Piso de seguridad: ${M.fmt.usd(efectivos.pisoCaja)}`],
      ]
      kpisEl.innerHTML =
        cards
          .map(
            ([lbl, val, sub]) => `
          <div${stagAttr} class="card-glass card-glass-hover p-4 flex flex-col justify-between">
            <span class="ui-micro text-[#647A78]">${lbl}</span>
            <strong class="font-editorial text-2xl md:text-3xl text-[#10201F] my-1">${val}</strong>
            <span class="text-xs text-[#425856]">${sub}</span>
          </div>`,
          )
          .join('') +
        `<div${stagAttr} class="card-glass card-glass-hover p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-2">
          <span class="ui-micro text-[#647A78]">Relación LTV:CAC por canal</span>
          <div class="flex flex-wrap items-center gap-2 my-1.5">
            <span>Meta ${M.semaforoHTML(r.ltvCacMeta, M.fmt.mult(r.ltvCacMeta))}</span>
            <span>Google ${M.semaforoHTML(r.ltvCacGoogle, M.fmt.mult(r.ltvCacGoogle))}</span>
          </div>
          <span class="text-xs text-[#425856]">Umbral: ≥3,0x saludable · 1,0–2,99x ajustado · &lt;1,0x destruye valor</span>
        </div>`
    }

    // Banner de la trampa
    const trampaBanner = document.getElementById('tablero-trampa-banner')
    if (trampaBanner) {
      if (t.vecesMasBaratoLead && t.sobrecostoCliente != null) {
        trampaBanner.innerHTML = `<strong>La trampa en vivo:</strong> el lead de Meta cuesta <strong>${M.fmt.num(t.vecesMasBaratoLead)}x menos</strong> (${M.fmt.usd(t.cplMeta)} vs. ${M.fmt.usd(t.cplGoogle)}), pero cada cliente cerrado en Meta cuesta <strong>${M.fmt.pct(Math.abs(t.sobrecostoCliente))} ${t.sobrecostoCliente >= 0 ? 'más' : 'menos'}</strong> (${M.fmt.usd(t.cacMeta)} vs. ${M.fmt.usd(t.cacGoogle)}).`
      } else {
        trampaBanner.innerHTML = `Activa presupuesto en ambos canales para visualizar la comparación directa entre CPL y CAC real.`
      }
    }

    renderEmbudoRadiografia(r, efectivos.costoVisita)

    // Gráfica 1: CPL vs CAC anuncios vs CAC real
    C.renderBarChart(document.getElementById('chart-cpl-cac'), {
      categories: ['Canal Meta', 'Canal Google'],
      series: [
        { name: 'CPL (USD/lead)', color: '#94A7A5', values: [r.cplMeta || 0, r.cplGoogle || 0] },
        { name: 'CAC anuncios', color: '#D9C7A6', values: [r.cacAnunciosMeta || 0, r.cacAnunciosGoogle || 0] },
        { name: 'CAC real (anuncios + visitas)', color: '#2F6F73', values: [r.cacRealMeta || 0, r.cacRealGoogle || 0] },
      ],
      yFormatter: (v) => `$${Math.round(v)}`,
      tipFormatter: (v) => M.fmt.usd(v),
      showValueLabels: true,
    })

    // Gráfica 2: Embudo lado a lado con línea de capacidad
    C.renderBarChart(document.getElementById('chart-embudo-barras'), {
      categories: ['Leads', 'Contactados', 'Agendadas', 'Pedidas', 'Hechas', 'Ventas'],
      series: [
        { name: 'Meta', color: '#2F6F73', values: [r.leadsMeta, r.contactadosMeta, r.agendadasMeta, r.solicitadasMeta, r.hechasMeta, r.ventasMeta] },
        { name: 'Google', color: '#D98A2B', values: [r.leadsGoogle, r.contactadosGoogle, r.agendadasGoogle, r.solicitadasGoogle, r.hechasGoogle, r.ventasGoogle] },
      ],
      refLine: { value: efectivos.capacidad, label: `Capacidad: ${efectivos.capacidad} visitas`, color: '#A63D33' },
      yFormatter: (v) => String(Math.round(v)),
      tipFormatter: (v) => `${M.fmt.num(v)} unidades`,
    })

    // Gráfica 3: Curva histórica inversión -> leads (línea que se dibuja y puntos al final)
    C.renderLineChart(document.getElementById('chart-curva-historica'), {
      categories: state.supuestos.curva.map((c) => `$${c.inv / 1000}k`),
      series: [
        { name: 'Leads Meta', color: '#2F6F73', values: state.supuestos.curva.map((c) => c.meta), highlight: true },
        { name: 'Leads Google (tope 160)', color: '#D98A2B', values: state.supuestos.curva.map((c) => c.google), highlight: true },
      ],
      refLine: { value: 160, label: 'Techo Google: 160 leads ($8k)', color: '#8C6D3F' },
      yFormatter: (v) => `${Math.round(v)}`,
      tipFormatter: (v) => M.fmt.leads(v),
      showAllPoints: true,
    })

    // Tabla en vivo por canal y combinado
    const tbody = document.getElementById('tablero-tabla-body')
    if (tbody) {
      const rows = [
        ['Inversión mensual (USD)', M.fmt.usd(esc.meta), M.fmt.usd(esc.google), `<strong>${M.fmt.usd(r.anuncios)}</strong>`],
        ['Leads generados', M.fmt.leads(r.leadsMeta), M.fmt.leads(r.leadsGoogle), `<strong>${M.fmt.leads(r.leadsTotales)}</strong>`],
        ['Contactados', `${M.fmt.num(r.contactadosMeta)} pers.`, `${M.fmt.num(r.contactadosGoogle)} pers.`, `${M.fmt.num(r.contactadosTotales)} pers.`],
        ['Visitas solicitadas', M.fmt.visitas(r.solicitadasMeta), M.fmt.visitas(r.solicitadasGoogle), M.fmt.visitas(r.solicitadas)],
        ['Visitas realizadas (cupo ' + efectivos.capacidad + ')', M.fmt.visitas(r.hechasMeta), M.fmt.visitas(r.hechasGoogle), `<strong>${M.fmt.visitas(r.realizadas)} (${M.fmt.pct(r.usoCapacidad)})</strong>`],
        ['Visitas perdidas por tope', M.fmt.visitas(r.perdidas), '0 visitas', M.fmt.visitas(r.perdidas)],
        ['Ventas cerradas', M.fmt.ventas(r.ventasMeta), M.fmt.ventas(r.ventasGoogle), `<strong>${M.fmt.ventas(r.ventas)}</strong>`],
        ['Visitas necesarias por venta', M.fmt.visitasVenta(r.visitasPorVentaMeta), M.fmt.visitasVenta(r.visitasPorVentaGoogle), M.fmt.visitasVenta(r.visitasPorVentaCombinado)],
        ['CPL · Costo por lead', M.fmt.usd(r.cplMeta), M.fmt.usd(r.cplGoogle), M.fmt.usd(r.cplCombinado)],
        ['CAC solo anuncios', M.fmt.usd(r.cacAnunciosMeta), M.fmt.usd(r.cacAnunciosGoogle), M.fmt.usd(r.cacAnunciosCombinado)],
        ['<strong>CAC real (anuncios + visitas)</strong>', `<strong>${M.fmt.usd(r.cacRealMeta)}</strong>`, `<strong>${M.fmt.usd(r.cacRealGoogle)}</strong>`, `<strong>${M.fmt.usd(r.cacCombinado)}</strong>`],
        ['LTV:CAC', M.semaforoHTML(r.ltvCacMeta, M.fmt.mult(r.ltvCacMeta)), M.semaforoHTML(r.ltvCacGoogle, M.fmt.mult(r.ltvCacGoogle)), M.semaforoHTML(r.ltvCacCombinado, M.fmt.mult(r.ltvCacCombinado))],
        ['Valor esperado por visita', M.fmt.usd(r.valorVisitaMeta), M.fmt.usd(r.valorVisitaGoogle), M.fmt.usd(r.valorVisitaCombinado)],
        ['Payback en caja del cliente', `${r.paybackMesMeta || '—'} (${M.fmt.usd(r.paybackMetaSiguiente)})`, `${r.paybackMesGoogle || '—'} (${M.fmt.usd(r.paybackGoogleSiguiente)})`, 'Mes 2 (instalación)'],
      ]
      tbody.innerHTML = rows.map(([m, a, b, c]) => `<tr><td>${m}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')
    }
  }

  function renderArquitecturaEconomica() {
    const S = state.supuestos
    const eqUSD = S.precio * S.equipos
    const instUSD = S.precio * S.instalacion
    const comUSD = S.precio * S.comision
    const baseContrib = S.precio * (1 - S.equipos - S.instalacion - S.comision)
    const batNeta = S.bateria.precio * (S.bateria.margen - S.bateria.comision)

    const setTxt = (id, txt) => {
      const el = document.getElementById(id)
      if (el) el.textContent = txt
    }
    setTxt('layer-precio', M.fmt.usd(S.precio))
    setTxt('layer-equipos', `−${M.fmt.usd(eqUSD)} (55% contado)`)
    setTxt('layer-instalacion', `−${M.fmt.usd(instUSD)} cuadrilla · −${M.fmt.usd(comUSD)} comisión`)
    setTxt('layer-bateria', `+${M.fmt.usd(batNeta)} netos/batería (15% adop.)`)
    setTxt('layer-contribucion', `${M.fmt.usd(baseContrib)} base · ${M.fmt.usd(baseContrib + batNeta * S.bateria.adopcion)} c/bat.`)
  }

  function renderEscenariosSection(resultados, efectivos) {
    // Editor rápido de los 5 escenarios
    const escBody = document.getElementById('escenarios-edit-body')
    if (escBody) {
      escBody.innerHTML = state.escenarios
        .map(
          (e) => `
        <tr>
          <td class="font-medium text-[#10201F]">${e.nombre}</td>
          <td><input type="number" step="500" min="0" max="10000" value="${e.meta}" data-esc-id="${e.id}" data-esc-field="meta" class="solar-num-input w-24" /></td>
          <td><input type="number" step="500" min="0" max="8000" value="${e.google}" data-esc-id="${e.id}" data-esc-field="google" class="solar-num-input w-24" /></td>
          <td class="text-center"><input type="checkbox" ${e.filtro ? 'checked' : ''} data-esc-id="${e.id}" data-esc-flag="filtro" class="w-4 h-4 accent-[#2F6F73]" /></td>
          <td class="text-center"><input type="checkbox" ${e.bateria ? 'checked' : ''} data-esc-id="${e.id}" data-esc-flag="bateria" class="w-4 h-4 accent-[#2F6F73]" /></td>
          <td class="text-center"><input type="checkbox" ${e.cplFijo ? 'checked' : ''} data-esc-id="${e.id}" data-esc-flag="cplFijo" class="w-4 h-4 accent-[#2F6F73]" /></td>
        </tr>`,
        )
        .join('')

      escBody.querySelectorAll('[data-esc-field]').forEach((inp) => {
        inp.addEventListener('change', (ev) => {
          const id = ev.target.getAttribute('data-esc-id')
          const field = ev.target.getAttribute('data-esc-field')
          const v = Math.max(0, Number(ev.target.value) || 0)
          state.escenarios = state.escenarios.map((x) => (x.id === id ? { ...x, [field]: v } : x))
          renderAll()
        })
      })
      escBody.querySelectorAll('[data-esc-flag]').forEach((chk) => {
        chk.addEventListener('change', (ev) => {
          const id = ev.target.getAttribute('data-esc-id')
          const flag = ev.target.getAttribute('data-esc-flag')
          state.escenarios = state.escenarios.map((x) => (x.id === id ? { ...x, [flag]: ev.target.checked ? 1 : 0 } : x))
          renderAll()
        })
      })
    }

    // Matriz completa de resultados por escenario
    const headRow = document.getElementById('resultados-matrix-head')
    const matrixBody = document.getElementById('resultados-matrix-body')
    if (headRow) {
      headRow.innerHTML = `<th>Indicador (unidad)</th>` + resultados.map((e) => `<th>${e.nombre}</th>`).join('')
    }
    if (matrixBody) {
      matrixBody.innerHTML = M.INDICADORES_TABLA.map(([label, key, fn]) => {
        const cols = resultados
          .map((e) => {
            const val = e.r[key]
            const txt = fn(val)
            return `<td>${key.startsWith('ltvCac') ? M.semaforoHTML(val, txt) : txt}</td>`
          })
          .join('')
        const highlight = key === 'neto' || key === 'ventas' || key === 'cacRealMeta' || key === 'cacRealGoogle'
        return `<tr class="${highlight ? 'font-medium bg-[#E3EAE8]/55' : ''}"><td>${label}</td>${cols}</tr>`
      }).join('')
    }

    // Gráfica de visitas vs capacidad en los 5 escenarios
    C.renderBarChart(document.getElementById('chart-escenarios-capacidad'), {
      categories: resultados.map((e) => e.nombre),
      series: [
        { name: 'Visitas solicitadas', color: '#D9C7A6', values: resultados.map((e) => e.r.solicitadas) },
        { name: 'Visitas realizadas', color: '#2F6F73', values: resultados.map((e) => e.r.realizadas) },
        { name: 'Visitas perdidas', color: '#A63D33', values: resultados.map((e) => e.r.perdidas) },
      ],
      refLine: { value: efectivos.capacidad, label: `Capacidad: ${efectivos.capacidad} visitas`, color: '#D98A2B' },
      yFormatter: (v) => String(Math.round(v)),
      tipFormatter: (v) => M.fmt.visitas(v),
    })

    // Editor completo de supuestos base complementarios (fijos, caja, batería, equipos, filtro)
    const supGrid = document.getElementById('supuestos-extra-grid')
    if (supGrid) {
      const extraFields = [
        ['costosFijos', 'Costos fijos mensuales', 'USD/mes', 500, false],
        ['cajaInicial', 'Caja inicial (Mes 1)', 'USD', 1000, false],
        ['pisoCaja', 'Piso mínimo de caja (Sofía)', 'USD', 500, false],
        ['ventasMesAnterior', 'Ventas por instalar Mes 0', 'ventas', 1, false],
        ['equipos', 'Costo equipos (% precio)', '%', 0.5, true],
        ['instalacion', 'Mano de obra instalación (%)', '%', 0.5, true],
        ['cplPrometido', 'CPL prometido agencia', 'USD/lead', 0.5, false],
        ['filtro.reduccionLeads', 'Reducción leads con filtro', '%', 1, true],
        ['bateria.precio', 'Precio batería adicional', 'USD', 100, false],
        ['bateria.margen', 'Margen bruto batería', '%', 1, true],
        ['bateria.comision', 'Comisión sobre batería', '%', 0.5, true],
        ['costoTecnico', 'Sueldo técnico extra', 'USD/mes', 100, false],
      ]
      supGrid.innerHTML = extraFields
        .map(([ruta, label, unit, step, isPct]) => {
          const raw = M.leerRuta(state.supuestos, ruta)
          const val = isPct ? Math.round(raw * 1000) / 10 : raw
          return `
          <div class="panel-compact p-3.5 flex items-center justify-between gap-2">
            <div>
              <span class="block ui-label text-[#10201F]">${label}</span>
              <span class="ui-micro text-[#647A78]">${unit}</span>
            </div>
            <input type="number" step="${step}" min="0" value="${val}" data-sup-ruta="${ruta}" data-sup-pct="${isPct ? '1' : '0'}" class="solar-num-input w-24" />
          </div>`
        })
        .join('')

      supGrid.querySelectorAll('[data-sup-ruta]').forEach((inp) => {
        inp.addEventListener('change', (ev) => {
          const ruta = ev.target.getAttribute('data-sup-ruta')
          const isPct = ev.target.getAttribute('data-sup-pct') === '1'
          const num = Math.max(0, Number(ev.target.value) || 0)
          state.supuestos = M.asignarRuta(state.supuestos, ruta, isPct ? Number((num / 100).toFixed(4)) : num)
          renderAll()
        })
      })
    }
  }

  function renderSimuladorSection() {
    const S = state.supuestos
    const sims = state.planes.map((p) => {
      const filas = M.simular(M.aPlan(p), S)
      return { ...p, filas, res: M.resumirPlan(filas, S) }
    })
    const elegido = sims.find((s) => s.id === state.planSel) || sims[0]
    const actualPlan = sims[0]

    const deltaCaja = elegido.res.cajaMes24 - actualPlan.res.cajaMes24
    const deltaInst = elegido.res.instalaciones - actualPlan.res.instalaciones

    const simKpis = document.getElementById('simulador-kpis')
    if (simKpis) {
      const firstSim = !simKpis.dataset.hydrated
      simKpis.dataset.hydrated = '1'
      const stagAttr = firstSim ? ' data-stagger-item' : ''
      simKpis.innerHTML = `
        <div${stagAttr} class="card-glass card-glass-hover p-4">
          <span class="ui-micro text-[#647A78]">Plan activo</span>
          <strong class="block font-editorial text-xl text-[#10201F] mt-1">${elegido.nombre}</strong>
          <span class="text-xs text-[#2F6F73]">Clic en la tabla para cambiar</span>
        </div>
        <div${stagAttr} class="card-glass card-glass-hover p-4">
          <span class="ui-micro text-[#647A78]">Caja al cierre Mes 24</span>
          <strong class="block font-editorial text-2xl md:text-3xl text-[#10201F] mt-1">${M.fmt.usd(elegido.res.cajaMes24)}</strong>
          <span class="text-xs ${deltaCaja >= 0 ? 'text-[#2F6F73]' : 'text-[#A63D33]'}">${deltaCaja >= 0 ? '+' : ''}${M.fmt.usd(deltaCaja)} vs. Actual</span>
        </div>
        <div${stagAttr} class="card-glass card-glass-hover p-4">
          <span class="ui-micro text-[#647A78]">Instalaciones 24M</span>
          <strong class="block font-editorial text-2xl md:text-3xl text-[#10201F] mt-1">${M.fmt.num(elegido.res.instalaciones)}</strong>
          <span class="text-xs text-[#425856]">${deltaInst >= 0 ? '+' : ''}${M.fmt.num(deltaInst)} frente al actual</span>
        </div>
        <div${stagAttr} class="card-glass card-glass-hover p-4">
          <span class="ui-micro text-[#647A78]">Caja mínima y mes crítico</span>
          <strong class="block font-editorial text-2xl md:text-3xl text-[#10201F] mt-1">${M.fmt.usd(elegido.res.cajaMinima)}</strong>
          <span class="text-xs text-[#425856]">Mes ${elegido.res.mesCajaMinima} · Piso ${M.fmt.usd(S.pisoCaja)}</span>
        </div>
        <div${stagAttr} class="card-glass card-glass-hover p-4">
          <span class="ui-micro text-[#647A78]">Auditoría de reglas</span>
          <div class="mt-2">${
            elegido.res.cumpleReglas
              ? '<span class="badge-semaforo badge-verde">● Piso $5k y Mes 19 OK</span>'
              : '<span class="badge-semaforo badge-rojo">● Incumple restricción</span>'
          }</div>
          <span class="block text-xs text-[#425856] mt-1">Sin bajar inversión desde M19</span>
        </div>
      `
    }

    // Tabla editable de los 5 planes
    const planesBody = document.getElementById('simulador-planes-body')
    if (planesBody) {
      planesBody.innerHTML = sims
        .map(
          (s) => `
        <tr class="${s.id === elegido.id ? 'row-selected' : ''}">
          <td>
            <button type="button" data-select-plan="${s.id}" class="text-left font-medium text-[#10201F] hover:text-[#2F6F73] flex items-center gap-2">
              <span class="inline-block w-2.5 h-2.5 rounded-full ${s.id === elegido.id ? 'bg-[#2F6F73]' : 'bg-[#10201F]/20'}"></span>
              <span>${s.nombre}</span>
            </button>
          </td>
          <td><input type="number" step="500" min="0" max="10000" value="${s.meta}" data-plan-id="${s.id}" data-plan-field="meta" class="solar-num-input w-20" /></td>
          <td><input type="number" step="500" min="0" max="8000" value="${s.google}" data-plan-id="${s.id}" data-plan-field="google" class="solar-num-input w-20" /></td>
          <td><input type="number" step="1" min="0" max="24" value="${s.escalaDesde || 0}" data-plan-id="${s.id}" data-plan-field="escalaDesde" class="solar-num-input w-14" /></td>
          <td><input type="number" step="500" min="0" max="10000" value="${s.metaFase2 ?? s.meta}" data-plan-id="${s.id}" data-plan-field="metaFase2" class="solar-num-input w-20" /></td>
          <td><input type="number" step="500" min="0" max="8000" value="${s.googleFase2 ?? s.google}" data-plan-id="${s.id}" data-plan-field="googleFase2" class="solar-num-input w-20" /></td>
          <td><input type="number" step="1" min="0" max="24" value="${s.filtroDesde}" data-plan-id="${s.id}" data-plan-field="filtroDesde" class="solar-num-input w-14" /></td>
          <td><input type="number" step="1" min="0" max="24" value="${s.tecnico1}" data-plan-id="${s.id}" data-plan-field="tecnico1" class="solar-num-input w-14" /></td>
          <td><input type="number" step="1" min="0" max="24" value="${s.tecnico2}" data-plan-id="${s.id}" data-plan-field="tecnico2" class="solar-num-input w-14" /></td>
          <td>${M.fmt.usd(s.res.cajaMinima)} <span class="text-xs text-[#647A78]">(M${s.res.mesCajaMinima})</span></td>
          <td><strong>${M.fmt.usd(s.res.cajaMes24)}</strong></td>
          <td>${M.fmt.num(s.res.instalaciones)}</td>
          <td>${s.res.cumpleReglas ? '<span class="badge-semaforo badge-verde">OK</span>' : '<span class="badge-semaforo badge-rojo">Alerta</span>'}</td>
        </tr>`,
        )
        .join('')

      planesBody.querySelectorAll('[data-select-plan]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.planSel = btn.getAttribute('data-select-plan')
          renderSimuladorSection()
        })
      })
      planesBody.querySelectorAll('[data-plan-field]').forEach((inp) => {
        inp.addEventListener('change', (ev) => {
          const id = ev.target.getAttribute('data-plan-id')
          const field = ev.target.getAttribute('data-plan-field')
          const val = Math.max(0, Number(ev.target.value) || 0)
          state.planes = state.planes.map((p) => (p.id === id ? { ...p, [field]: val } : p))
          renderSimuladorSection()
          updateHeroDynamicBadges()
        })
      })
    }

    // Gráfica SVG de líneas de caja 24 meses (se dibuja el trazo y emergen puntos)
    const palette = ['#647A78', '#A63D33', '#8C6D3F', '#2F6F73', '#D98A2B']
    C.renderLineChart(document.getElementById('chart-simulador-caja'), {
      categories: Array.from({ length: M.MESES }, (_, i) => `M${i + 1}`),
      series: sims.map((s, idx) => ({
        name: s.nombre,
        color: palette[idx % palette.length],
        width: s.id === elegido.id ? 3.1 : 1.8,
        highlight: s.id === elegido.id,
        values: s.filas.map((f) => f.caja),
      })),
      height: 320,
      refLine: { value: S.pisoCaja, label: `Piso mínimo Sofía: ${M.fmt.usd(S.pisoCaja)}`, color: '#A63D33' },
      yFormatter: (v) => `$${Math.round(v / 1000)}k`,
      tipFormatter: (v) => M.fmt.usd(v),
    })

    // Gráfica SVG de visitas vs capacidad del plan elegido
    C.renderLineChart(document.getElementById('chart-simulador-visitas'), {
      categories: elegido.filas.map((f) => `M${f.mes}`),
      series: [
        { name: 'Visitas pedidas', color: '#D98A2B', values: elegido.filas.map((f) => f.pedidas), width: 2.2 },
        { name: 'Visitas realizadas', color: '#2F6F73', values: elegido.filas.map((f) => f.hechas), width: 2.8, highlight: true },
        { name: 'Capacidad instalada', color: '#10201F', values: elegido.filas.map((f) => f.capacidad), width: 1.8, dashed: true },
      ],
      height: 270,
      yFormatter: (v) => `${Math.round(v)}`,
      tipFormatter: (v) => M.fmt.visitas(v),
    })

    // Pitch de 2 minutos al banco
    const pitchEl = document.getElementById('simulador-pitch-content')
    if (pitchEl) {
      const tecs = [elegido.tecnico1, elegido.tecnico2].filter((m) => m > 0)
      const descInv =
        elegido.escalaDesde > 0
          ? `${M.fmt.usd(elegido.meta)} en Meta + ${M.fmt.usd(elegido.google)} en Google durante la fase de entrenamiento, escalando en el Mes ${elegido.escalaDesde} a ${M.fmt.usd(elegido.metaFase2)} Meta + ${M.fmt.usd(elegido.googleFase2)} Google cuando la capacidad llega a 200 visitas`
          : `${M.fmt.usd(elegido.meta)} en Meta y ${M.fmt.usd(elegido.google)} en Google constantes cada mes`
      pitchEl.innerHTML = `
        <li class="pb-2 border-b border-[#EEF2F1]/12"><strong class="text-[#D9C7A6]">1. Ruta de inversión disciplinada:</strong> ${descInv}. Jamás se recorta inversión después del Mes 19.</li>
        <li class="pb-2 border-b border-[#EEF2F1]/12"><strong class="text-[#D9C7A6]">2. Sincronización operativa:</strong> ${tecs.length ? `contratación de técnicos en los meses ${tecs.join(' y ')} ($1.800/mes pagados desde su ingreso; +50 visitas activas al mes siguiente)` : 'sin técnicos adicionales'}; filtro de calidad y llamada en &lt;5 min ${elegido.filtroDesde > 0 ? `activos desde el Mes ${elegido.filtroDesde}` : 'inactivos'}.</li>
        <li class="pb-2 border-b border-[#EEF2F1]/12"><strong class="text-[#D9C7A6]">3. Retorno acumulado a 24 meses:</strong> cierra con <strong>${M.fmt.usd(elegido.res.cajaMes24)}</strong> en caja y <strong>${M.fmt.ventas(elegido.res.instalaciones)}</strong> instaladas, manteniendo una caja mínima de <strong>${M.fmt.usd(elegido.res.cajaMinima)}</strong> en el Mes ${elegido.res.mesCajaMinima} (piso exigido: ${M.fmt.usd(S.pisoCaja)}).</li>
        <li><strong class="text-[#D9C7A6]">4. Riesgo y escalabilidad:</strong> el mes de firma absorbe −$520 de capital de trabajo por pago de paneles al contado; negociar crédito de 30 días con el proveedor y abrir canales de referidos permite superar el techo de 160 leads de Google.</li>
      `
    }

    // Revisión manual paso a paso del Mes 1
    const mes1Body = document.getElementById('mes1-audit-body')
    if (mes1Body) {
      const d = M.detalleMes1(S)
      const rows = [
        ['Leads Meta / Google', `${M.fmt.num(d.leads.meta)} / ${M.fmt.num(d.leads.google)} leads`, 'Curva histórica ($4.000 por canal → 500 y 100 leads)'],
        ['Visitas realizadas totales', M.fmt.visitas(d.emb.realizadas), `57,75 Meta + 39,74 Google = 97,49 visitas (dentro de ${S.capacidad})`],
        ['Ventas cerradas Mes 1', M.fmt.ventas(d.emb.ventas), '10,395 Meta + 11,92125 Google = 22,31625 instalaciones'],
        ['(+) Entradas: 50% ventas Mes 1 + 50% Mes 0', M.fmt.usd(d.entradas), `${M.fmt.usd(d.entradasMes)} (Mes 1) + ${M.fmt.usd(d.entradasPrev)} (${S.ventasMesAnterior} ventas sept.)`],
        ['(−) Salida: equipos (55%) + comisión (3%) Mes 1', M.fmt.usd(d.equipos + d.comision), `${M.fmt.usd(d.equipos)} equipos + ${M.fmt.usd(d.comision)} comisión`],
        ['(−) Salida: instalación (17%) ventas Mes 0', M.fmt.usd(d.instalacion), `17% × ${M.fmt.usd(S.precio)} × ${S.ventasMesAnterior} instalaciones`],
        ['(−) Salida: visitas + anuncios + costos fijos', M.fmt.usd(d.visitas + 8000 + S.costosFijos), `${M.fmt.usd(d.visitas)} visitas + $8.000 anuncios + ${M.fmt.usd(S.costosFijos)} fijos`],
        ['(=) Caja final Mes 1 verificada', `<strong>${M.fmt.usd(d.cajaFinal)}</strong>`, `${M.fmt.usd(S.cajaInicial)} inicial + ${M.fmt.usd(d.entradas)} − ${M.fmt.usd(d.salidas)}`],
      ]
      mes1Body.innerHTML = rows.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td class="text-left text-xs text-[#425856]">${c}</td></tr>`).join('')
    }

    // Tabla de 24 meses del plan elegido
    const m24Body = document.getElementById('simulador-24m-body')
    const btnClearCustom = document.getElementById('btn-clear-mes-custom')
    if (btnClearCustom) {
      btnClearCustom.classList.toggle('hidden', !elegido.mesesCustom)
    }
    if (m24Body) {
      m24Body.innerHTML = elegido.filas
        .map(
          (f, idx) => `
        <tr class="${f.alerta ? 'row-alert' : ''}">
          <td class="font-medium">Mes ${f.mes}${f.mes >= 19 ? ' <span title="Desde el mes 19 no puede bajar la inversión">🔒</span>' : ''}</td>
          <td>${
            state.editarMesAMes
              ? `<input type="number" step="500" min="0" max="10000" value="${f.meta}" data-mcustom-idx="${idx}" data-mcustom-ch="meta" class="solar-num-input w-20" />`
              : M.fmt.usd(f.meta)
          }</td>
          <td>${
            state.editarMesAMes
              ? `<input type="number" step="500" min="0" max="8000" value="${f.google}" data-mcustom-idx="${idx}" data-mcustom-ch="google" class="solar-num-input w-20" />`
              : M.fmt.usd(f.google)
          }</td>
          <td>${M.fmt.num(f.leads)}</td>
          <td>${M.fmt.num(f.pedidas)}</td>
          <td>${f.capacidad}</td>
          <td>${M.fmt.num(f.hechas)}</td>
          <td>${M.fmt.num(f.ventas)}</td>
          <td>${M.fmt.usd(f.entradas)}</td>
          <td>${M.fmt.usd(f.salidas)}</td>
          <td><strong>${M.fmt.usd(f.caja)}</strong></td>
          <td>${f.alerta ? '<span class="badge-semaforo badge-rojo">Bajo $5k</span>' : '<span class="badge-semaforo badge-verde">OK</span>'}</td>
        </tr>`,
        )
        .join('')

      m24Body.querySelectorAll('[data-mcustom-idx]').forEach((inp) => {
        inp.addEventListener('change', (ev) => {
          const mIdx = Number(ev.target.getAttribute('data-mcustom-idx'))
          const ch = ev.target.getAttribute('data-mcustom-ch')
          const val = Math.max(0, Number(ev.target.value) || 0)
          const base = elegido.mesesCustom
            ? elegido.mesesCustom.map((x) => ({ ...x }))
            : elegido.filas.map((fl) => ({ meta: fl.meta, google: fl.google }))
          base[mIdx] = { ...base[mIdx], [ch]: val }
          state.planes = state.planes.map((p) => (p.id === elegido.id ? { ...p, mesesCustom: base } : p))
          renderSimuladorSection()
        })
      })
    }
  }

  function renderRecomendacionDynamic(resultados) {
    const get = (id) => resultados.find((x) => x.id === id)?.r
    const act = get('actual')
    const agH = get('agHist')
    const fil = get('filtro')
    const prop = get('propuesta')
    if (!act || !agH || !fil || !prop) return

    const setTxt = (id, v) => {
      const el = document.getElementById(id)
      if (el) el.textContent = v
    }
    setTxt('rec-cac-meta', M.fmt.usd(act.cacRealMeta))
    setTxt('rec-cac-google', M.fmt.usd(act.cacRealGoogle))
    setTxt('rec-neto-actual', M.fmt.usd(act.neto))
    setTxt('rec-neto-agencia', M.fmt.usd(agH.neto))
    setTxt('rec-neto-filtro', M.fmt.usd(fil.neto))
    setTxt('rec-neto-propuesta', M.fmt.usd(prop.neto))
    setTxt('rec-caja-actual', M.fmt.usd(act.cajaFinalMes1))
    setTxt('rec-caja-propuesta', M.fmt.usd(prop.cajaFinalMes1))
  }

  function updateHeroDynamicBadges() {
    const act = M.calcular(state.escenarios[0], state.supuestos)
    const prop = M.calcular(state.escenarios[4], state.supuestos)
    const p4 = state.planes.find((p) => p.id === 'p4') || state.planes[0]
    const res24 = M.resumirPlan(M.simular(M.aPlan(p4), state.supuestos), state.supuestos)

    const setTxt = (id, v) => {
      const el = document.getElementById(id)
      if (el) el.textContent = v
    }
    setTxt('hero-cac-google', M.fmt.usd(act.cacRealGoogle))
    setTxt('hero-cac-meta', M.fmt.usd(act.cacRealMeta))
    setTxt('hero-neto-prop', M.fmt.usd(prop.neto))
    setTxt('hero-caja-24m', M.fmt.usdInt(res24.cajaMes24))
  }

  function renderExcelAudit() {
    const box = document.getElementById('excel-audit-output')
    if (!box) return
    if (!state.informeExcel) {
      box.innerHTML = ''
      return
    }
    const inf = state.informeExcel
    const comp = inf.comparacion
    box.innerHTML = `
      <div class="card-glass p-6 space-y-4 mt-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="font-editorial text-2xl text-[#10201F]">Auditoría del archivo <em>${inf.archivo}</em></h4>
          <span class="badge-semaforo badge-verde">● ${inf.cargados.length} bloques sincronizados</span>
        </div>
        ${
          comp
            ? `
          <div class="rounded-2xl p-4 border ${comp.coincide ? 'bg-[#2F6F73]/12 border-[#2F6F73]/30' : 'bg-[#D98A2B]/15 border-[#D98A2B]/40'}">
            <strong class="ui-label">${comp.coincide ? '✅ Coincidencia verificada (< 1%):' : '⚠ Diferencia detectada:'}</strong>
            <span class="text-sm ml-1">${comp.comparaciones.length} celdas comparadas contra la hoja <em>Resultados</em> · Diferencia máxima: <strong>${M.fmt.num(comp.max * 100)}%</strong>.</span>
          </div>
          <div>
            <button type="button" id="btn-toggle-excel-cells" class="ui-btn px-4 py-2 bg-[#E3EAE8] border border-[#10201F]/15 text-[#10201F]">
              ${state.verDetalleExcel ? 'Ocultar auditoría celda por celda' : 'Ver auditoría celda por celda'}
            </button>
          </div>
          ${
            state.verDetalleExcel
              ? `<div class="overflow-x-auto max-h-80"><table class="solar-table">
                  <thead><tr><th>Indicador</th><th>Escenario</th><th>Excel</th><th>Sitio Web</th><th>Dif. (%)</th></tr></thead>
                  <tbody>${comp.comparaciones
                    .map(
                      (c) => `<tr><td>${c.indicador}</td><td>${c.escenario}</td><td>${M.fmt.num(c.excel)}</td><td>${M.fmt.num(c.app)}</td><td>${M.fmt.pct(c.dif)}</td></tr>`,
                    )
                    .join('')}</tbody>
                </table></div>`
              : ''
          }
        `
            : `<p class="text-sm text-[#425856]">Se cargaron los supuestos correctamente (el libro no incluía valores cacheados en una hoja llamada Resultados).</p>`
        }
      </div>
    `
    const btn = document.getElementById('btn-toggle-excel-cells')
    if (btn) {
      btn.addEventListener('click', () => {
        state.verDetalleExcel = !state.verDetalleExcel
        renderExcelAudit()
      })
    }
  }

  async function handleExcelFile(file) {
    const errBox = document.getElementById('excel-error-box')
    if (errBox) errBox.innerHTML = ''
    if (!file) return
    if (!window.XLSX) {
      if (errBox) errBox.innerHTML = `<div class="rounded-2xl bg-[#A63D33]/12 border border-[#A63D33]/35 p-4 text-sm">La librería XLSX por CDN no está disponible sin conexión a internet.</div>`
      return
    }
    try {
      const buf = await file.arrayBuffer()
      const wb = window.XLSX.read(buf, { type: 'array' })
      if (!wb.Sheets.Supuestos) throw new Error('No se encontró la hoja "Supuestos"')
      const filasSup = window.XLSX.utils.sheet_to_json(wb.Sheets.Supuestos, { header: 1, defval: null })
      const parsed = M.parsearSupuestos(filasSup, M.SUPUESTOS_BASE, M.ESCENARIOS_BASE)
      state.supuestos = parsed.supuestos
      state.escenarios = parsed.escenarios

      let comparacion = null
      if (wb.Sheets.Resultados) {
        const filasRes = window.XLSX.utils.sheet_to_json(wb.Sheets.Resultados, { header: 1, defval: null })
        const calc = parsed.escenarios.map((e) => ({ nombre: e.nombre, r: M.calcular(e, parsed.supuestos) }))
        comparacion = M.compararConExcel(filasRes, calc)
      }
      state.informeExcel = { archivo: file.name, ...parsed, comparacion }
      renderAll()
      renderExcelAudit()
    } catch (err) {
      if (errBox) {
        errBox.innerHTML = `<div class="rounded-2xl bg-[#A63D33]/12 border border-[#A63D33]/35 p-4 text-sm text-[#8C2B22]">Error al leer ${file.name}: ${err.message}</div>`
      }
    }
  }

  function exportExcelWorkbook() {
    if (!window.XLSX) return
    const resultados = state.escenarios.map((e) => ({ ...e, r: M.calcular(e, state.supuestos) }))
    const simulaciones = state.planes.map((p) => ({ nombre: p.nombre, filas: M.simular(M.aPlan(p), state.supuestos) }))
    const hojas = M.construirHojasExportacion({
      supuestos: state.supuestos,
      escenarios: state.escenarios,
      resultados,
      simulaciones,
    })
    const wb = window.XLSX.utils.book_new()
    Object.entries(hojas).forEach(([name, aoa]) => {
      const ws = window.XLSX.utils.aoa_to_sheet(aoa)
      window.XLSX.utils.book_append_sheet(wb, ws, name)
    })
    window.XLSX.writeFile(wb, 'Sol_de_Casa_resultados.xlsx')
  }

  function renderAll() {
    const efectivos = M.conTecnicos(state.supuestos)
    const resultados = state.escenarios.map((e) => ({ ...e, r: M.calcular(e, state.supuestos) }))

    syncSlidersValues()
    updateHeroDynamicBadges()
    renderTableroSection(efectivos)
    renderArquitecturaEconomica()
    renderEscenariosSection(resultados, efectivos)
    renderSimuladorSection()
    renderRecomendacionDynamic(resultados)
  }

  function bindGlobalEvents() {
    // Presets del tablero
    const presets = {
      actual: { meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 },
      agHist: { meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 0 },
      agPromesa: { meta: 8000, google: 0, filtro: 0, bateria: 0, cplFijo: 1 },
      propuesta: { meta: 4000, google: 4000, filtro: 1, bateria: 1, cplFijo: 0 },
    }
    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset')
        if (presets[key]) {
          state.tableroEsc = { ...presets[key] }
          renderAll()
        }
      })
    })

    // Reinicio completo a los datos del caso
    document.querySelectorAll('[data-reset-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.supuestos = M.clonar(M.SUPUESTOS_BASE)
        state.escenarios = M.clonar(M.ESCENARIOS_BASE)
        state.planes = M.clonar(M.PLANES_INICIALES)
        state.tableroEsc = { meta: 4000, google: 4000, filtro: 0, bateria: 0, cplFijo: 0 }
        state.planSel = 'p4'
        renderAll()
      })
    })

    // Toggles del tablero
    const bindChk = (id, field) => {
      const el = document.getElementById(id)
      if (el) {
        el.addEventListener('change', (e) => {
          state.tableroEsc[field] = e.target.checked ? 1 : 0
          renderAll()
        })
      }
    }
    bindChk('chk-tablero-filtro', 'filtro')
    bindChk('chk-tablero-bateria', 'bateria')
    bindChk('chk-tablero-cpl', 'cplFijo')

    // Simulador: edición mes a mes y copia de pitch
    const chkMes = document.getElementById('chk-editar-mes-a-mes')
    if (chkMes) {
      chkMes.addEventListener('change', (e) => {
        state.editarMesAMes = e.target.checked
        renderSimuladorSection()
      })
    }
    const btnClearMes = document.getElementById('btn-clear-mes-custom')
    if (btnClearMes) {
      btnClearMes.addEventListener('click', () => {
        state.planes = state.planes.map((p) => (p.id === state.planSel ? { ...p, mesesCustom: undefined } : p))
        renderSimuladorSection()
      })
    }
    const btnCopyPitch = document.getElementById('btn-copy-pitch')
    if (btnCopyPitch) {
      btnCopyPitch.addEventListener('click', async () => {
        const plan = state.planes.find((p) => p.id === state.planSel) || state.planes[0]
        const res = M.resumirPlan(M.simular(M.aPlan(plan), state.supuestos), state.supuestos)
        const txt = `Sol de Casa · ${plan.nombre} (24 meses)\n- Caja Mes 24: ${M.fmt.usd(res.cajaMes24)} | Instalaciones: ${M.fmt.num(res.instalaciones)}\n- Caja mínima: ${M.fmt.usd(res.cajaMinima)} (Mes ${res.mesCajaMinima}) vs. piso de ${M.fmt.usd(state.supuestos.pisoCaja)}\n- Cumple piso y regla Mes 19: ${res.cumpleReglas ? 'SÍ' : 'Revisar'}`
        try {
          await navigator.clipboard.writeText(txt)
          const orig = btnCopyPitch.textContent
          btnCopyPitch.textContent = '✓ Resumen copiado'
          setTimeout(() => { btnCopyPitch.textContent = orig }, 2000)
        } catch (_) {}
      })
    }

    // Imprimir recomendación de 1 página
    const btnPrint = document.getElementById('btn-print-rec')
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        document.body.dataset.printTarget = 'recomendacion'
        window.print()
      })
    }

    // Exportar e importar Excel
    document.querySelectorAll('[data-export-xlsx]').forEach((btn) => {
      btn.addEventListener('click', exportExcelWorkbook)
    })
    const fileInp = document.getElementById('excel-file-input')
    if (fileInp) {
      fileInp.addEventListener('change', (ev) => {
        const f = ev.target.files && ev.target.files[0]
        ev.target.value = ''
        handleExcelFile(f)
      })
    }
    const dropzone = document.getElementById('excel-dropzone')
    if (dropzone) {
      dropzone.addEventListener('dragover', (ev) => {
        ev.preventDefault()
        dropzone.classList.add('ring-2', 'ring-[#2F6F73]')
      })
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('ring-2', 'ring-[#2F6F73]')
      })
      dropzone.addEventListener('drop', (ev) => {
        ev.preventDefault()
        dropzone.classList.remove('ring-2', 'ring-[#2F6F73]')
        const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]
        handleExcelFile(f)
      })
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildSlidersDOM()
    bindGlobalEvents()
    renderAll()
    if (window.SolMotion) window.SolMotion.init()
  })
})()
