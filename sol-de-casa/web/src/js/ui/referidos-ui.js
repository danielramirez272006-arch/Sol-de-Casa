// Controlador interactivo Mobile-First · Parte 2 de Sol de Casa (5 vistas conectadas + Ficha Growth)
;(function () {
  const R = window.SolReferidos
  const M = window.SolDeCasa
  const C = window.SolCharts

  if (!R) return

  const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'

  const state = {
    vistaActiva: 1, // 1: Mi ahorro | 2: Compartir | 3: Vecino | 4: Mis referidos | 5: Panel Andrés
    familia: { ...R.FAMILIA_DEMO },
    reciboFamilia: R.CONFIG_REFERIDOS_BASE.reciboEjemplo, // $110
    pctAhorro: R.CONFIG_REFERIDOS_BASE.porcentajeAhorro, // 70%
    mesesInstalado: R.CONFIG_REFERIDOS_BASE.mesesInstaladoEjemplo, // 8 meses
    enlaceCopiado: false,
    vecinoRecibo: 110, // USD/mes en calculadora del vecino
    calculadoraContabilizada: false,
    vecinoForm: {
      nombre: '',
      contacto: '',
      franja: 'Mañana (9:00 – 12:00)',
      techoPropio: true,
    },
    ultimaConfirmacionVecino: null,
    referidos: R.REFERIDOS_INICIALES.map((x) => ({ ...x })),
    telemetria: { ...R.TELEMETRIA_BASE },
    backendStatus: 'probando', // 'conectado' | 'offline' | 'probando'
    backendUrl: window.SOL_API_URL || (window.location.port === '3001' ? '/api' : 'http://localhost:3001/api'),
  }

  // Comprobar disponibilidad del servidor Express y MySQL
  async function verificarConexionBackend() {
    try {
      const res = await fetch(`${state.backendUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(1800) : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        state.backendStatus = data.database && data.database.conectada ? 'conectado_db' : 'conectado_api'
      } else {
        state.backendStatus = 'offline'
      }
    } catch (_) {
      state.backendStatus = 'offline'
    }
    updateLiveStatusRibbon()
  }
  verificarConexionBackend()

  function motionPaused() {
    return (
      (window.SolMotion && window.SolMotion.isPaused()) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    )
  }

  function fmtUSD(n, dec = 0) {
    if (n == null || !Number.isFinite(n)) return '—'
    return (
      '$' +
      n.toLocaleString('es-ES', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      })
    )
  }

  function fmtNum(n, dec = 1) {
    if (n == null || !Number.isFinite(n)) return '—'
    return n.toLocaleString('es-ES', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  }

  // Animación numérica fluida al aparecer "Mi ahorro"
  function animateCount(el, target, prefix = '$', suffix = '', decimals = 0, duration = 680) {
    if (!el) return
    if (motionPaused()) {
      el.textContent = `${prefix}${fmtNum(target, decimals)}${suffix}`
      return
    }
    const start = performance.now()
    function tick(now) {
      if (motionPaused()) {
        el.textContent = `${prefix}${fmtNum(target, decimals)}${suffix}`
        return
      }
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      const cur = target * eased
      el.textContent = `${prefix}${fmtNum(cur, decimals)}${suffix}`
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  // Transición breve entre las 5 vistas conectadas
  function animateStepTransition(container) {
    if (!container || motionPaused() || !container.animate) return
    const anim = container.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: 250, easing: EASE_EXPO, fill: 'forwards' },
    )
    if (window.SolMotion) window.SolMotion.track(anim)
  }

  function setVista(nuevaVista, opts = {}) {
    state.vistaActiva = nuevaVista
    renderJourney({ animateStep: !opts.silent })
    if (opts.scrollIntoView) {
      const shell = document.getElementById('ref-journey-stage')
      if (shell) {
        shell.scrollIntoView({ behavior: motionPaused() ? 'auto' : 'smooth', block: 'nearest' })
      }
    }
  }

  // Copia robusta al portapapeles (funciona en HTTPS, localhost y file://)
  async function copyTextSafe(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch (_) {
      return false
    }
  }

  // =========================================================================
  // VISTA 1 · MI AHORRO
  // =========================================================================
  function htmlVista1() {
    const d = R.calcularAhorroFamilia(state.reciboFamilia, state.pctAhorro, state.mesesInstalado)
    return `
      <div class="p-5 sm:p-6 space-y-5">
        <div class="flex items-center justify-between gap-2">
          <div>
            <span class="ui-micro text-[#2F6F73]">1 · Portal de la familia</span>
            <h3 class="font-editorial text-2xl text-[#10201F] mt-0.5">${state.familia.nombre} · Mi <em>ahorro</em></h3>
          </div>
          <span class="badge-semaforo badge-amarillo" title="Datos de demostración del prototipo">● Simulado</span>
        </div>

        <!-- Tarjeta protagonista de ahorro mensual -->
        <div class="wa-share-card p-5 space-y-4">
          <div class="flex items-center justify-between text-xs text-[#D9C7A6]">
            <span class="ui-micro">Ahorro solar de este mes</span>
            <span class="px-2.5 py-0.5 rounded-full bg-[#EEF2F1]/12 text-[#EEF2F1] ui-micro">−${Math.round(d.porcentajeAhorro * 100)}% en recibo</span>
          </div>

          <div class="flex items-baseline justify-between gap-3">
            <strong id="ref-anim-ahorro-mes" class="font-editorial text-5xl text-white">${fmtUSD(d.ahorroMensual, 0)}</strong>
            <span class="text-xs text-[#EEF2F1]/80 text-right">Recibo anterior: <s class="opacity-75">${fmtUSD(d.reciboAnterior, 0)}</s><br/>Nuevo recibo: <strong class="text-[#D9C7A6]">${fmtUSD(d.reciboNuevo, 0)}/mes</strong></span>
          </div>

          <!-- Barra animada de cobertura solar -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs text-[#EEF2F1]/85">
              <span>Cobertura fotovoltaica del hogar</span>
              <strong>${Math.round(d.porcentajeAhorro * 100)}%</strong>
            </div>
            <div class="h-2.5 rounded-full bg-[#EEF2F1]/15 overflow-hidden">
              <div id="ref-bar-cobertura" class="ref-progress-fill bg-[#D98A2B]" style="width: 0%"></div>
            </div>
          </div>
        </div>

        <!-- Ahorro acumulado desde la instalación -->
        <div class="grid grid-cols-2 gap-3">
          <div class="panel-compact p-4">
            <span class="ui-micro text-[#647A78]">Acumulado (${d.mesesInstalado} meses)</span>
            <strong id="ref-anim-ahorro-acum" class="block font-editorial text-3xl text-[#10201F] mt-1">${fmtUSD(d.ahorroAcumulado, 0)}</strong>
            <span class="text-xs text-[#2F6F73]">Desde la instalación · Simulado</span>
          </div>
          <div class="panel-compact p-4">
            <span class="ui-micro text-[#647A78]">Energía limpia generada</span>
            <strong class="block font-editorial text-3xl text-[#10201F] mt-1">${d.kwhMesEvitados} <span class="text-base font-sans">kWh</span></strong>
            <span class="text-xs text-[#425856]">Este mes en cubierta</span>
          </div>
        </div>

        <!-- Control opcional de recibo de ejemplo -->
        <div class="rounded-2xl bg-[#E3EAE8]/75 border border-[#10201F]/10 p-3.5 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <label for="rng-familia-recibo" class="ui-label text-[#425856]">Recibo anterior de referencia (Simulado)</label>
            <strong class="text-[#10201F]">${fmtUSD(d.reciboAnterior, 0)}/mes → ahorra ${fmtUSD(d.ahorroMensual, 0)}/mes</strong>
          </div>
          <input id="rng-familia-recibo" type="range" min="70" max="250" step="10" value="${d.reciboAnterior}" class="solar-range" />
        </div>

        <!-- Llamada a la acción principal pedida -->
        <button id="btn-ir-compartir" type="button" class="ui-btn w-full py-3.5 px-5 bg-[#2F6F73] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md">
          <span>Compartir mi ahorro</span>
          <span aria-hidden="true">→</span>
        </button>

        <p class="text-xs text-center text-[#647A78]">
          Invita a un vecino: si instala con Sol de Casa, recibes <strong>$100</strong> al firmarse su contrato y él recibe <strong>$60</strong> de descuento.
        </p>
      </div>
    `
  }

  // =========================================================================
  // VISTA 2 · COMPARTIR TARJETA WHATSAPP
  // =========================================================================
  function htmlVista2() {
    const d = R.calcularAhorroFamilia(state.reciboFamilia, state.pctAhorro, state.mesesInstalado)
    const msgWA = `¡Hola vecino! Desde que instalamos paneles con Sol de Casa nuestro recibo bajó un ${Math.round(d.porcentajeAhorro * 100)}% (ahorramos ${fmtUSD(d.ahorroMensual, 0)} al mes). Aquí puedes calcular en 30 segundos cuánto ahorrarías en tu casa: ${state.familia.enlaceBase}`
    return `
      <div class="p-5 sm:p-6 space-y-5">
        <div class="flex items-center justify-between gap-2">
          <div>
            <span class="ui-micro text-[#2F6F73]">2 · Recomendación barrial</span>
            <h3 class="font-editorial text-2xl text-[#10201F] mt-0.5">Tarjeta para <em>WhatsApp</em></h3>
          </div>
          <span class="badge-semaforo badge-amarillo">● Vista previa</span>
        </div>

        <!-- Vista previa animada de la tarjeta visual lista para WhatsApp -->
        <div id="ref-wa-preview-card" class="wa-share-card p-5 space-y-4 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="ui-micro text-[#D9C7A6]">Sol de Casa · Techo verificado</span>
            <span class="px-2 py-0.5 rounded-full bg-[#EEF2F1]/15 text-[10px] text-[#EEF2F1] ui-micro">Simulado</span>
          </div>

          <div class="space-y-1">
            <p class="text-xs text-[#EEF2F1]/80">${state.familia.nombre} · ${state.familia.colonia}</p>
            <p class="font-editorial text-3xl text-white leading-tight">
              Ahorramos <em class="text-[#D9C7A6] not-italic underline decoration-[#D98A2B]/70">${fmtUSD(d.ahorroMensual, 0)} al mes</em> con luz de mañana.
            </p>
          </div>

          <div class="rounded-xl bg-[#10201F]/45 border border-[#EEF2F1]/15 p-3 flex items-center justify-between gap-2">
            <div class="truncate">
              <span class="block ui-micro text-[#D9C7A6]">Enlace personal de referido</span>
              <span class="text-xs text-[#EEF2F1] ui-label truncate block">${state.familia.enlaceBase}</span>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-[#D98A2B] text-[#10201F] ui-micro font-semibold">−$60 vecino</span>
          </div>
        </div>

        <!-- Burbuja de mensaje sugerido para WhatsApp -->
        <div class="rounded-2xl bg-[#E3EAE8] border border-[#10201F]/12 p-3.5 space-y-1.5">
          <span class="ui-micro text-[#2F6F73]">Mensaje listo para enviar</span>
          <p class="text-xs text-[#10201F] leading-relaxed">“${msgWA}”</p>
        </div>

        <!-- Confirmación al copiar enlace -->
        <div id="ref-copy-feedback" class="${state.enlaceCopiado ? '' : 'hidden'} rounded-2xl bg-[#2F6F73]/14 border border-[#2F6F73]/35 px-4 py-3 text-xs text-[#1D4F52] font-medium flex items-center justify-between gap-2">
          <span>✓ Enlace personal copiado (${state.familia.codigo}). Ya puedes pegarlo en el chat de tu vecino.</span>
        </div>

        <div class="grid grid-cols-1 gap-2.5">
          <button id="btn-copy-ref-link" type="button" class="ui-btn w-full py-3.5 px-4 bg-[#10201F] text-[#EEF2F1] flex items-center justify-center gap-2">
            <span>${state.enlaceCopiado ? '✓ Volver a copiar mi enlace personal' : 'Copiar enlace personal para WhatsApp'}</span>
          </button>

          <button id="btn-open-as-neighbor" type="button" class="ui-btn w-full py-3.5 px-4 bg-[#2F6F73] text-white flex items-center justify-center gap-2">
            <span>Abrir enlace como lo vería mi vecino</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    `
  }

  // =========================================================================
  // VISTA 3 · LA PÁGINA DEL VECINO (CALCULADORA + SOLICITUD HONESTA)
  // =========================================================================
  function htmlVista3() {
    const calc = R.calcularAhorroVecino({
      reciboMensual: state.vecinoRecibo,
      pctAhorro: R.CONFIG_REFERIDOS_BASE.porcentajeAhorro,
      precioInstalacion: R.CONFIG_REFERIDOS_BASE.precioInstalacion,
      bonoVecino: R.CONFIG_REFERIDOS_BASE.premioVecino,
    })

    return `
      <div class="p-5 sm:p-6 space-y-5">
        <!-- Cabecera que conserva explícitamente quién refirió al vecino -->
        <div class="rounded-2xl bg-[#D9C7A6]/40 border border-[#D9C7A6] px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div class="text-xs text-[#10201F]">
            <span class="ui-micro text-[#8A5210] block">Invitación verificada</span>
            Referido por <strong>${state.familia.nombre}</strong> (<span class="ui-label">${state.familia.codigo}</span>)
          </div>
          <span class="badge-semaforo badge-verde">Bono −$60</span>
        </div>

        <div>
          <span class="ui-micro text-[#2F6F73]">3 · La página del vecino</span>
          <h3 class="font-editorial text-2xl text-[#10201F] mt-0.5">Calcula tu ahorro <em>solar</em></h3>
        </div>

        <!-- Calculadora interactiva sobre instalación de $6.500 -->
        <div class="panel-compact p-4 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <label for="num-vecino-recibo" class="ui-label text-[#10201F]">¿Cuánto pagas hoy de luz al mes?</label>
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-[#647A78]">$</span>
              <input id="num-vecino-recibo" type="number" min="30" max="500" step="5" value="${calc.reciboMensual}" class="solar-num-input w-24 text-base" />
              <span class="ui-micro text-[#647A78]">USD</span>
            </div>
          </div>

          <input id="rng-vecino-recibo" type="range" min="40" max="350" step="5" value="${Math.min(350, calc.reciboMensual)}" class="solar-range" />

          <div class="grid grid-cols-2 gap-3 pt-1">
            <div class="rounded-2xl bg-[#EEF2F1] border border-[#10201F]/10 p-3.5">
              <span class="ui-micro text-[#2F6F73]">Ahorro estimado (70%)</span>
              <strong class="block font-editorial text-3xl text-[#10201F] mt-0.5">${fmtUSD(calc.ahorroMensual, 0)}<span class="text-sm font-sans">/mes</span></strong>
              <span class="text-xs text-[#425856]">${fmtUSD(calc.ahorroAnual, 0)} al año · Simulado</span>
            </div>
            <div class="rounded-2xl bg-[#EEF2F1] border border-[#10201F]/10 p-3.5">
              <span class="ui-micro text-[#8A5210]">Recuperación ($6.500)</span>
              <strong class="block font-editorial text-3xl text-[#10201F] mt-0.5">${fmtNum(calc.aniosRecuperacion, 1)} <span class="text-sm font-sans">años</span></strong>
              <span class="text-xs text-[#425856]">${fmtNum(calc.aniosConBono, 1)} años con bono −$60</span>
            </div>
          </div>
        </div>

        ${
          state.ultimaConfirmacionVecino
            ? `
          <!-- Estado de confirmación clara sin prometer disponibilidad no comprobada -->
          <div class="rounded-2xl bg-[#2F6F73]/12 border border-[#2F6F73]/35 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="badge-semaforo badge-verde">✓ Solicitud registrada · ${state.ultimaConfirmacionVecino.folio}</span>
              <span class="ui-micro text-[#647A78]">Simulado</span>
            </div>
            <p class="text-sm text-[#10201F]">
              Gracias, <strong>${state.ultimaConfirmacionVecino.nombre}</strong>. Registramos tu ahorro estimado de <strong>${fmtUSD(state.ultimaConfirmacionVecino.ahorro, 0)}/mes</strong> y vinculamos tu invitación a <strong>${state.ultimaConfirmacionVecino.referidor}</strong>.
            </p>
            <p class="text-xs text-[#425856] bg-[#EEF2F1] rounded-xl p-3 border border-[#10201F]/10">
              <strong>Disponibilidad sujeta a verificación:</strong> este prototipo no asigna fecha ni hora automática. Una asesora revisará primero el cupo real de los técnicos en tu zona y te contactará por WhatsApp (${state.ultimaConfirmacionVecino.franja}) para acordar horarios disponibles.
            </p>
            <div class="flex flex-wrap gap-2 pt-1">
              <button id="btn-ver-avance-vecino" type="button" class="ui-btn flex-1 py-3 px-4 bg-[#2F6F73] text-white text-center">
                Ver impacto en Mis referidos →
              </button>
              <button id="btn-nueva-solicitud-vecino" type="button" class="ui-btn py-3 px-3.5 bg-[#EEF2F1] border border-[#10201F]/15 text-[#10201F]">
                Otra prueba
              </button>
            </div>
          </div>
        `
            : `
          <!-- Formulario corto pensado para celular -->
          <form id="form-solicitud-vecino" class="space-y-3" novalidate>
            <div class="flex items-center justify-between">
              <span class="ui-label font-semibold text-[#10201F]">Solicitar evaluación técnica en techo</span>
              <button id="btn-autofill-vecino" type="button" class="ui-micro text-[#2F6F73] underline">Autocompletar demo</button>
            </div>

            <div>
              <label for="inp-vecino-nombre" class="ui-micro text-[#647A78] block mb-1">Tu nombre</label>
              <input id="inp-vecino-nombre" type="text" required placeholder="Ej. Carlos Méndez" value="${state.vecinoForm.nombre}" class="mobile-field" />
            </div>

            <div>
              <label for="inp-vecino-contacto" class="ui-micro text-[#647A78] block mb-1">WhatsApp y colonia</label>
              <input id="inp-vecino-contacto" type="text" required placeholder="Ej. +52 55 4123 8890 · Jardines del Sol" value="${state.vecinoForm.contacto}" class="mobile-field" />
            </div>

            <div>
              <label for="sel-vecino-franja" class="ui-micro text-[#647A78] block mb-1">Horario preferido para recibir llamada</label>
              <select id="sel-vecino-franja" class="mobile-field">
                <option value="Mañana (9:00 – 12:00)" ${state.vecinoForm.franja.startsWith('Mañana') ? 'selected' : ''}>Mañana (9:00 – 12:00)</option>
                <option value="Tarde (15:00 – 18:00)" ${state.vecinoForm.franja.startsWith('Tarde') ? 'selected' : ''}>Tarde (15:00 – 18:00)</option>
              </select>
            </div>

            <div class="rounded-xl bg-[#E3EAE8]/80 border border-[#10201F]/10 p-3 text-xs text-[#425856]">
              <strong>Aviso honesto de agenda:</strong> enviar esta solicitud no confirma día de visita. Primero comprobamos cobertura y cupo disponible de nuestra cuadrilla técnica antes de proponerte horarios reales.
            </div>

            <div id="vecino-form-error" class="hidden text-xs text-[#A63D33] font-medium">
              Por favor escribe tu nombre y un WhatsApp de contacto para registrar la solicitud.
            </div>

            <button type="submit" class="ui-btn w-full py-3.5 px-5 bg-[#10201F] text-[#EEF2F1] font-medium">
              Solicitar visita de evaluación
            </button>
          </form>
        `
        }
      </div>
    `
  }

  // =========================================================================
  // VISTA 4 · MIS REFERIDOS Y RECOMPENSAS
  // =========================================================================
  function htmlVista4() {
    const pres = R.calcularPresupuestoRecompensas()
    const firmados = state.referidos.filter((x) => x.etapa === 4).length
    const totalGanado = firmados * pres.premioReferidor

    return `
      <div class="p-5 sm:p-6 space-y-5">
        <div class="flex items-center justify-between gap-2">
          <div>
            <span class="ui-micro text-[#2F6F73]">4 · Seguimiento y premios</span>
            <h3 class="font-editorial text-2xl text-[#10201F] mt-0.5">Mis referidos y <em>recompensas</em></h3>
          </div>
          <span class="badge-semaforo badge-amarillo">● Simulado</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="panel-compact p-3.5">
            <span class="ui-micro text-[#647A78]">Recompensa ganada</span>
            <strong class="block font-editorial text-3xl text-[#2F6F73] mt-0.5">${fmtUSD(totalGanado, 0)}</strong>
            <span class="text-xs text-[#425856]">${firmados} ${firmados === 1 ? 'firma completada' : 'firmas completadas'}</span>
          </div>
          <div class="panel-compact p-3.5">
            <span class="ui-micro text-[#647A78]">Vecinos en proceso</span>
            <strong class="block font-editorial text-3xl text-[#10201F] mt-0.5">${state.referidos.length}</strong>
            <span class="text-xs text-[#425856]">Toca «Avanzar» para probar</span>
          </div>
        </div>

        <!-- Lista de vecinos con barras de progreso animadas -->
        <div class="space-y-3">
          ${state.referidos
            .map((item) => {
              const info = R.infoEtapaReferido(item.etapa)
              return `
              <div class="rounded-2xl bg-[#E3EAE8]/75 border border-[#10201F]/10 p-3.5 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <strong class="text-sm text-[#10201F] block">${item.nombre} ${item.nuevo ? '<span class="ui-micro text-[#2F6F73]">· Nuevo</span>' : ''}</strong>
                    <span class="text-xs text-[#647A78]">${item.zona} · ${item.fecha}</span>
                  </div>
                  <span class="badge-semaforo ${item.etapa === 4 ? 'badge-verde' : 'badge-gris'}">${info.titulo}</span>
                </div>

                <div class="h-2 rounded-full bg-[#10201F]/10 overflow-hidden">
                  <div class="ref-progress-fill" data-target-pct="${info.porcentaje}" style="width: 0%; background: ${info.color}"></div>
                </div>

                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-[#425856]">${info.detalle}</span>
                  ${
                    item.etapa < 4
                      ? `<button type="button" data-advance-ref="${item.id}" class="ui-micro text-[#2F6F73] hover:underline shrink-0">Simular avance →</button>`
                      : `<strong class="text-[#1D4F52] shrink-0">+$100 acreditados</strong>`
                  }
                </div>
              </div>
            `
            })
            .join('')}
        </div>

        <!-- Regla clara de liberación y cálculo previo de presupuesto ($300 máx.) -->
        <div class="rounded-2xl bg-[#EEF2F1] border border-[#10201F]/15 p-4 space-y-2.5 text-xs">
          <span class="ui-micro text-[#8A5210] block">Cálculo de presupuesto antes de premiar (tope $300/venta)</span>
          <div class="space-y-1 text-[#425856]">
            <div class="flex justify-between"><span>Tope máximo permitido por venta referida:</span><strong class="text-[#10201F]">$300,00</strong></div>
            <div class="flex justify-between"><span>Visitas por venta (cierre 45% → 1 ÷ 0,45 = 2,22 vis. × $60):</span><strong class="text-[#A63D33]">−$${fmtNum(pres.costoVisitasPorVenta, 2)}</strong></div>
            <div class="flex justify-between pt-1 border-t border-[#10201F]/10"><span><strong>Presupuesto disponible para premios:</strong></span><strong class="text-[#2F6F73]">$${fmtNum(pres.presupuestoDisponible, 2)}</strong></div>
            <div class="flex justify-between"><span>Premios definidos ($100 referidor + $60 vecino al firmar):</span><strong class="text-[#10201F]">$${fmtNum(pres.premiosTotales, 2)}</strong></div>
            <div class="flex justify-between pt-1 border-t border-[#10201F]/10"><span><strong>CAC total por venta referida (holgura $${fmtNum(pres.holguraPresupuesto, 2)}):</strong></span><strong class="text-[#1D4F52]">$${fmtNum(pres.cacTotalReferido, 2)} ≤ $300</strong></div>
          </div>
        </div>

        <button id="btn-ir-andres" type="button" class="ui-btn w-full py-3 px-4 bg-[#E3EAE8] border border-[#10201F]/15 text-[#10201F]">
          Ver impacto agregado en el Panel de Andrés →
        </button>
      </div>
    `
  }

  // =========================================================================
  // VISTA 5 · PANEL DE ANDRÉS (EMBUDO DE REFERIDOS + CAPACIDAD VS DEMANDA)
  // =========================================================================
  function htmlVista5() {
    const T = state.telemetria
    const pres = R.calcularPresupuestoRecompensas()

    // Integración en vivo con la capacidad del tablero general de Sol de Casa
    const sup = M ? M.SUPUESTOS_BASE : { capacidad: 100 }
    const capTotal = Number(document.querySelector('[data-input-key="sup.capacidad"]')?.value || sup.capacidad || 100) +
      Number(document.querySelector('[data-input-key="sup.tecnicosExtra"]')?.value || 0) * 50

    // Demanda actual de canales pagados (Google + Meta con filtro recomendado = ~68 a 72 visitas, o lectura orientativa)
    const visitasCanalesPagados = 72
    const visitasRefRealizadas = T.visitasRealizadas
    const solicitudesRefEnCola = Math.max(0, T.solicitudesVisita - T.visitasRealizadas)
    const demandaTotal = visitasCanalesPagados + visitasRefRealizadas + solicitudesRefEnCola
    const capacidadDisponible = Math.max(0, capTotal - visitasCanalesPagados - visitasRefRealizadas)
    const saturado = solicitudesRefEnCola > capacidadDisponible

    const pctPagados = Math.min(100, (visitasCanalesPagados / capTotal) * 100)
    const pctRef = Math.min(100 - pctPagados, (visitasRefRealizadas / capTotal) * 100)
    const pctCola = Math.min(100 - pctPagados - pctRef, (solicitudesRefEnCola / capTotal) * 100)

    return `
      <div class="p-5 sm:p-6 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="ui-micro text-[#2F6F73]">5 · Control gerencial de crecimiento</span>
            <h3 class="font-editorial text-2xl sm:text-3xl text-[#10201F] mt-0.5">Panel de <em>Andrés</em> · Canal Referidos</h3>
          </div>
          <span class="badge-semaforo badge-amarillo">● Datos simulados en vivo</span>
        </div>

        <!-- 5 indicadores conectados del embudo de referidos -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div class="panel-compact p-3">
            <span class="ui-micro text-[#647A78]">1. Compartidas</span>
            <strong class="block font-editorial text-2xl text-[#10201F] mt-0.5">${T.tarjetasCompartidas}</strong>
            <span class="text-[11px] text-[#425856]">Tarjetas WhatsApp</span>
          </div>
          <div class="panel-compact p-3">
            <span class="ui-micro text-[#647A78]">2. Calculadora</span>
            <strong class="block font-editorial text-2xl text-[#10201F] mt-0.5">${T.usoCalculadora}</strong>
            <span class="text-[11px] text-[#425856]">${Math.round((T.usoCalculadora / Math.max(1, T.tarjetasCompartidas)) * 100)}% de aperturas</span>
          </div>
          <div class="panel-compact p-3">
            <span class="ui-micro text-[#8A5210]">3. Solicitudes</span>
            <strong class="block font-editorial text-2xl text-[#10201F] mt-0.5">${T.solicitudesVisita}</strong>
            <span class="text-[11px] text-[#425856]">Piden visita</span>
          </div>
          <div class="panel-compact p-3">
            <span class="ui-micro text-[#2F6F73]">4. Visitas hechas</span>
            <strong class="block font-editorial text-2xl text-[#10201F] mt-0.5">${T.visitasRealizadas}</strong>
            <span class="text-[11px] text-[#425856]">Costo: ${fmtUSD(T.visitasRealizadas * 60, 0)}</span>
          </div>
          <div class="panel-compact p-3 col-span-2 sm:col-span-1 bg-[#2F6F73]/12 border-[#2F6F73]/30">
            <span class="ui-micro text-[#2F6F73]">5. Firmadas</span>
            <strong class="block font-editorial text-2xl text-[#2F6F73] mt-0.5">${T.ventasFirmadas}</strong>
            <span class="text-[11px] text-[#1D4F52]">${fmtNum((T.ventasFirmadas / Math.max(1, T.visitasRealizadas)) * 100, 0)}% cierre · CAC $${fmtNum(pres.cacTotalReferido, 0)}</span>
          </div>
        </div>

        <!-- Capacidad disponible junto a la demanda -->
        <div class="rounded-2xl bg-[#EEF2F1] border border-[#10201F]/15 p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="ui-micro text-[#10201F]">Capacidad técnica mensual frente a demanda total</span>
              <p class="text-xs text-[#425856]">Cupo instalado: <strong>${capTotal} visitas/mes</strong> · Disponible hoy: <strong class="${saturado ? 'text-[#A63D33]' : 'text-[#2F6F73]'}">${capacidadDisponible} visitas libres</strong> (${solicitudesRefEnCola} solicitudes de referidos por agendar)</p>
            </div>
            <span class="badge-semaforo ${saturado ? 'badge-rojo' : 'badge-verde'}">
              ${saturado ? '⚠ Cola supera cupo libre' : '● Capacidad suficiente'}
            </span>
          </div>

          <!-- Barra apilada de ocupación de cuadrilla -->
          <div class="h-3.5 rounded-full bg-[#10201F]/10 overflow-hidden flex">
            <div style="width:${pctPagados.toFixed(1)}%; background:#647A78" title="Canales digitales: ${visitasCanalesPagados} visitas"></div>
            <div style="width:${pctRef.toFixed(1)}%; background:#2F6F73" title="Referidos visitados: ${visitasRefRealizadas} visitas"></div>
            <div style="width:${pctCola.toFixed(1)}%; background:#D98A2B" title="Solicitudes de referidos en cola: ${solicitudesRefEnCola}"></div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#425856]">
            <span>■ Digitales pagados: <strong>${visitasCanalesPagados}</strong></span>
            <span class="text-[#2F6F73]">■ Referidos visitados: <strong>${visitasRefRealizadas}</strong></span>
            <span class="text-[#8A5210]">■ Solicitudes por confirmar: <strong>${solicitudesRefEnCola}</strong></span>
            <span>□ Cupo libre sin asignar: <strong>${ Math.max(0, capTotal - demandaTotal) }</strong></span>
          </div>
        </div>

        <!-- Gráfica SVG del embudo de referidos -->
        <div class="panel-compact p-4 space-y-2">
          <span class="ui-micro text-[#647A78]">Conversión paso a paso del ciclo de referidos (Simulado)</span>
          <div id="chart-andres-referidos"></div>
        </div>
      </div>
    `
  }

  // =========================================================================
  // RENDERIZADO Y ENLACE DE EVENTOS DEL RECORRIDO
  // =========================================================================
  function updateLiveStatusRibbon() {
    const el = document.getElementById('ref-live-trace')
    if (!el) return

    let badgeBackend = ''
    if (state.backendStatus === 'conectado_db') {
      badgeBackend = `<span class="badge-semaforo badge-verde" title="Servidor Node/Express y base de datos MySQL conectados">● Backend + MySQL activo</span>`
    } else if (state.backendStatus === 'conectado_api') {
      badgeBackend = `<span class="badge-semaforo badge-amarillo" title="API Express activa (Base de datos en espera)">● API Express activa</span>`
    } else {
      badgeBackend = `<span class="badge-semaforo badge-gris" title="Modo autónomo interactivo con datos simulados">● Prototipo autónomo</span>`
    }

    el.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 w-full">
        <div class="flex flex-wrap items-center gap-2">
          <span>Referidor activo: <strong class="text-[#10201F]">${state.familia.nombre}</strong></span>
          <span class="hidden sm:inline">·</span>
          <span>Tarjetas compartidas: <strong class="text-[#2F6F73]">${state.telemetria.tarjetasCompartidas}</strong></span>
          <span class="hidden sm:inline">·</span>
          <span>Solicitudes de vecinos: <strong class="text-[#8A5210]">${state.telemetria.solicitudesVisita}</strong></span>
          <span class="hidden sm:inline">·</span>
          <span>Ventas referidas: <strong class="text-[#2F6F73]">${state.telemetria.ventasFirmadas}</strong></span>
        </div>
        <div>${badgeBackend}</div>
      </div>
    `
  }

  function renderJourney(opts = {}) {
    const stage = document.getElementById('ref-journey-stage')
    if (!stage) return

    // Actualizar pestañas activas de las 5 vistas
    document.querySelectorAll('[data-ref-step]').forEach((btn) => {
      const step = Number(btn.getAttribute('data-ref-step'))
      btn.setAttribute('aria-selected', step === state.vistaActiva ? 'true' : 'false')
    })

    // En la vista 5 (Panel de Andrés), permitimos mayor ancho en escritorio para visualizar cómodamente la gráfica y métricas
    stage.classList.toggle('max-w-[820px]', state.vistaActiva === 5)

    if (state.vistaActiva === 1) stage.innerHTML = htmlVista1()
    else if (state.vistaActiva === 2) stage.innerHTML = htmlVista2()
    else if (state.vistaActiva === 3) stage.innerHTML = htmlVista3()
    else if (state.vistaActiva === 4) stage.innerHTML = htmlVista4()
    else stage.innerHTML = htmlVista5()

    updateLiveStatusRibbon()
    if (opts.animateStep) animateStepTransition(stage)

    bindStepEvents(stage)
    runStepAnimations(stage)
  }

  function bindStepEvents(stage) {
    // Vista 1
    const rngFam = stage.querySelector('#rng-familia-recibo')
    if (rngFam) {
      rngFam.addEventListener('input', (ev) => {
        state.reciboFamilia = Number(ev.target.value)
        renderJourney({ animateStep: false })
      })
    }
    const btnComp = stage.querySelector('#btn-ir-compartir')
    if (btnComp) {
      btnComp.addEventListener('click', () => setVista(2, { scrollIntoView: true }))
    }

    // Vista 2
    const btnCopy = stage.querySelector('#btn-copy-ref-link')
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        await copyTextSafe(state.familia.enlaceBase)
        if (!state.enlaceCopiado) {
          state.telemetria.tarjetasCompartidas += 1
        }
        state.enlaceCopiado = true
        renderJourney({ animateStep: false })
      })
    }
    const btnOpenVecino = stage.querySelector('#btn-open-as-neighbor')
    if (btnOpenVecino) {
      btnOpenVecino.addEventListener('click', () => {
        if (!state.enlaceCopiado) {
          state.telemetria.tarjetasCompartidas += 1
          state.enlaceCopiado = true
        }
        setVista(3, { scrollIntoView: true })
      })
    }

    // Vista 3
    const updateVecinoCalc = (val) => {
      const num = Math.max(30, Math.min(500, Number(val) || 110))
      state.vecinoRecibo = num
      if (!state.calculadoraContabilizada) {
        state.calculadoraContabilizada = true
        state.telemetria.usoCalculadora += 1
      }
      renderJourney({ animateStep: false })
    }
    const rngVec = stage.querySelector('#rng-vecino-recibo')
    const numVec = stage.querySelector('#num-vecino-recibo')
    if (rngVec) rngVec.addEventListener('change', (e) => updateVecinoCalc(e.target.value))
    if (numVec) numVec.addEventListener('change', (e) => updateVecinoCalc(e.target.value))

    const btnAutofill = stage.querySelector('#btn-autofill-vecino')
    if (btnAutofill) {
      btnAutofill.addEventListener('click', () => {
        state.vecinoForm = {
          nombre: 'Carlos Méndez',
          contacto: '+52 55 4890 1234 · Jardines del Sol',
          franja: 'Mañana (9:00 – 12:00)',
          techoPropio: true,
        }
        renderJourney({ animateStep: false })
      })
    }

    const formVec = stage.querySelector('#form-solicitud-vecino')
    if (formVec) {
      formVec.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        const nombre = stage.querySelector('#inp-vecino-nombre')?.value.trim() || ''
        const contacto = stage.querySelector('#inp-vecino-contacto')?.value.trim() || ''
        const franja = stage.querySelector('#sel-vecino-franja')?.value || 'Mañana (9:00 – 12:00)'
        state.vecinoForm = { nombre, contacto, franja, techoPropio: true }

        if (!nombre || !contacto) {
          const err = stage.querySelector('#vecino-form-error')
          if (err) err.classList.remove('hidden')
          return
        }

        if (!state.calculadoraContabilizada) {
          state.calculadoraContabilizada = true
          state.telemetria.usoCalculadora += 1
        }
        state.telemetria.solicitudesVisita += 1

        const calc = R.calcularAhorroVecino({ reciboMensual: state.vecinoRecibo })
        let folio = `REF-${200 + state.referidos.length + 1}`

        // Intento de persistencia real en el backend Express + MySQL
        try {
          const res = await fetch(`${state.backendUrl}/publico/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codigoReferido: 'GOMEZ70SOL',
              nombreVecino: nombre,
              telefono: contacto,
              reciboActualUsd: state.vecinoRecibo,
              horarioPreferencia: franja,
              consentimientoContacto: true,
              esSimulada: true,
            }),
            signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
          })
          if (res.ok) {
            const data = await res.json()
            if (data.data?.solicitudId) {
              folio = `MYSQL-${data.data.solicitudId}`
            }
          }
        } catch (_) {
          // Si el backend no está disponible en este momento, se continúa con el folio simulado sin interrumpir la experiencia
        }

        state.ultimaConfirmacionVecino = {
          folio,
          nombre,
          contacto,
          franja,
          ahorro: calc.ahorroMensual,
          referidor: state.familia.nombre,
        }

        state.referidos.unshift({
          id: folio.toLowerCase(),
          nombre,
          zona: `Recibo $${state.vecinoRecibo}/mes · ${franja.split(' ')[0]}`,
          etapa: 1,
          fecha: 'Justo ahora',
          simulado: true,
          nuevo: true,
        })

        renderJourney({ animateStep: true })
      })
    }

    const btnVerAvance = stage.querySelector('#btn-ver-avance-vecino')
    if (btnVerAvance) {
      btnVerAvance.addEventListener('click', () => setVista(4, { scrollIntoView: true }))
    }
    const btnNuevaSol = stage.querySelector('#btn-nueva-solicitud-vecino')
    if (btnNuevaSol) {
      btnNuevaSol.addEventListener('click', () => {
        state.ultimaConfirmacionVecino = null
        state.vecinoForm = { nombre: '', contacto: '', franja: 'Mañana (9:00 – 12:00)', techoPropio: true }
        renderJourney({ animateStep: true })
      })
    }

    // Vista 4
    stage.querySelectorAll('[data-advance-ref]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-advance-ref')
        state.referidos = state.referidos.map((item) => {
          if (item.id !== id || item.etapa >= 4) return item
          const next = item.etapa + 1
          if (next === 2) state.telemetria.visitasRealizadas += 1
          if (next === 4) state.telemetria.ventasFirmadas += 1
          return { ...item, etapa: next }
        })
        renderJourney({ animateStep: false })
      })
    })

    const btnAndres = stage.querySelector('#btn-ir-andres')
    if (btnAndres) {
      btnAndres.addEventListener('click', () => setVista(5, { scrollIntoView: true }))
    }
  }

  function runStepAnimations(stage) {
    if (state.vistaActiva === 1) {
      const d = R.calcularAhorroFamilia(state.reciboFamilia, state.pctAhorro, state.mesesInstalado)
      animateCount(stage.querySelector('#ref-anim-ahorro-mes'), d.ahorroMensual, '$', '', 0, 650)
      animateCount(stage.querySelector('#ref-anim-ahorro-acum'), d.ahorroAcumulado, '$', '', 0, 780)
      const bar = stage.querySelector('#ref-bar-cobertura')
      if (bar) {
        if (motionPaused()) {
          bar.style.width = `${Math.round(d.porcentajeAhorro * 100)}%`
        } else {
          requestAnimationFrame(() => {
            bar.style.width = `${Math.round(d.porcentajeAhorro * 100)}%`
          })
        }
      }
    } else if (state.vistaActiva === 2) {
      const card = stage.querySelector('#ref-wa-preview-card')
      if (card && !motionPaused() && card.animate) {
        const anim = card.animate(
          [
            { opacity: 0.35, transform: 'scale(0.95) translateY(10px)' },
            { opacity: 1, transform: 'scale(1) translateY(0px)' },
          ],
          { duration: 480, easing: EASE_EXPO, fill: 'forwards' },
        )
        if (window.SolMotion) window.SolMotion.track(anim)
      }
    } else if (state.vistaActiva === 4) {
      const bars = stage.querySelectorAll('.ref-progress-fill[data-target-pct]')
      bars.forEach((bar, idx) => {
        const pct = bar.getAttribute('data-target-pct') || '25'
        if (motionPaused()) {
          bar.style.width = `${pct}%`
        } else {
          setTimeout(() => {
            bar.style.width = `${pct}%`
          }, 40 + idx * 70)
        }
      })
    } else if (state.vistaActiva === 5 && C) {
      const box = stage.querySelector('#chart-andres-referidos')
      if (box) {
        box.dataset.revealed = '1'
        const T = state.telemetria
        C.renderBarChart(box, {
          categories: ['Compartidas', 'Calculadora', 'Solicitudes', 'Visitas', 'Firmadas'],
          series: [
            {
              name: 'Flujo de referidos (unidades)',
              color: '#2F6F73',
              values: [T.tarjetasCompartidas, T.usoCalculadora, T.solicitudesVisita, T.visitasRealizadas, T.ventasFirmadas],
            },
          ],
          height: 220,
          yFormatter: (v) => String(Math.round(v)),
          tipFormatter: (v) => `${Math.round(v)} registros (Simulado)`,
          showValueLabels: true,
        })
      }
    }
  }

  function initPrintButtons() {
    const btnGrowth = document.getElementById('btn-print-growth')
    if (btnGrowth) {
      btnGrowth.addEventListener('click', () => {
        document.body.dataset.printTarget = 'growth'
        window.print()
      })
    }
    const btnRec = document.getElementById('btn-print-rec')
    if (btnRec) {
      btnRec.addEventListener('click', () => {
        document.body.dataset.printTarget = 'recomendacion'
      })
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ref-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = Number(btn.getAttribute('data-ref-step'))
        setVista(s)
      })
    })

    const btnResetRef = document.getElementById('btn-reset-referidos')
    if (btnResetRef) {
      btnResetRef.addEventListener('click', () => {
        state.reciboFamilia = R.CONFIG_REFERIDOS_BASE.reciboEjemplo
        state.enlaceCopiado = false
        state.vecinoRecibo = 110
        state.calculadoraContabilizada = false
        state.ultimaConfirmacionVecino = null
        state.vecinoForm = { nombre: '', contacto: '', franja: 'Mañana (9:00 – 12:00)', techoPropio: true }
        state.referidos = R.REFERIDOS_INICIALES.map((x) => ({ ...x }))
        state.telemetria = { ...R.TELEMETRIA_BASE }
        setVista(1)
      })
    }

    initPrintButtons()
    renderJourney({ animateStep: false })
  })
})()
