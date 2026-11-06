// Controlador unificado de movimiento: requestAnimationFrame, IntersectionObserver y Web Animations API
// Conserva el scroll nativo, respeta prefers-reduced-motion e incluye pausa global inmediata.
;(function () {
  const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'
  const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let manualPaused = false
  let activeAnimations = new Set()
  let energyMeta = []
  let rafPending = false

  function isPaused() {
    return manualPaused || mediaReduced.matches
  }

  function track(anim) {
    if (!anim) return
    activeAnimations.add(anim)
    const cleanup = () => activeAnimations.delete(anim)
    anim.addEventListener?.('finish', cleanup)
    anim.addEventListener?.('cancel', cleanup)
  }

  function updatePauseUI() {
    const paused = isPaused()
    document.documentElement.classList.toggle('motion-paused', paused)
    const btn = document.getElementById('btn-pause-motion')
    if (btn) {
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false')
      btn.innerHTML = paused
        ? '<span class="inline-block w-2 h-2 rounded-full bg-[#D98A2B]"></span><span>Reanudar animaciones</span>'
        : '<span class="inline-block w-2 h-2 rounded-full bg-[#2F6F73]"></span><span>Pausar animaciones</span>'
    }
    if (paused) {
      activeAnimations.forEach((a) => {
        try {
          a.finish()
        } catch (_) {
          try { a.cancel() } catch (__) {}
        }
      })
      activeAnimations.clear()
      // Dejar todos los elementos revelados y centrados en su posición natural
      document.querySelectorAll('.reveal-up, [data-stagger-item], .hero-line-inner').forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      const inlinePhoto = document.getElementById('hero-inline-photo')
      if (inlinePhoto) {
        inlinePhoto.style.opacity = '1'
        inlinePhoto.style.clipPath = 'none'
      }
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        el.style.transform = 'none'
      })
      document.querySelectorAll('[data-layer-offset]').forEach((el) => {
        el.style.transform = 'none'
      })
      energyMeta.forEach(({ path }) => {
        path.style.strokeDashoffset = '0'
      })
      document.querySelectorAll('path.anim-line').forEach((p) => {
        p.style.strokeDasharray = 'none'
        p.style.strokeDashoffset = '0'
      })
      document.querySelectorAll('circle.anim-point, text.anim-bar-label').forEach((pt) => {
        pt.style.opacity = '1'
        pt.style.transform = 'scale(1)'
      })
      document.querySelectorAll('rect.anim-bar').forEach((b) => {
        b.style.transform = 'scaleY(1)'
      })
    } else {
      scheduleScrollFrame()
    }
  }

  // 1. Verificación explícita de carga de las 3 fuentes tipográficas
  async function verifyFonts() {
    const badge = document.getElementById('font-status-indicator')
    if (!document.fonts || !document.fonts.ready) return
    try {
      await document.fonts.ready
      const okSerif = document.fonts.check('400 48px "DM Serif Display"')
      const okSans = document.fonts.check('400 16px "DM Sans"')
      const okInter = document.fonts.check('500 12px "Inter"')
      document.documentElement.dataset.fontsReady = okSerif && okSans && okInter ? 'verified' : 'fallback'
      if (badge) {
        badge.textContent =
          okSerif && okSans && okInter
            ? 'Tipografías activas: DM Serif Display · DM Sans · Inter'
            : 'Tipografías cargadas con respaldo del sistema'
      }
    } catch (_) {}
  }

  // 2. Entrada editorial de la portada: titular por líneas con rotación leve + foto que se expande
  function animateHeroEntrance() {
    const lines = Array.from(document.querySelectorAll('.hero-line-inner'))
    const inlinePhoto = document.getElementById('hero-inline-photo')
    const heroSub = Array.from(document.querySelectorAll('.hero-enter-sub'))

    if (isPaused()) {
      lines.forEach((l) => {
        l.style.opacity = '1'
        l.style.transform = 'none'
      })
      if (inlinePhoto) {
        inlinePhoto.style.opacity = '1'
        inlinePhoto.style.clipPath = 'none'
      }
      heroSub.forEach((s) => {
        s.style.opacity = '1'
        s.style.transform = 'none'
      })
      return
    }

    lines.forEach((line, idx) => {
      line.style.opacity = '0'
      const anim = line.animate(
        [
          { opacity: 0, transform: 'translateY(104%) rotate(2.4deg)' },
          { opacity: 1, transform: 'translateY(0%) rotate(0deg)' },
        ],
        { duration: 1080, delay: 90 + idx * 135, easing: EASE_EXPO, fill: 'forwards' },
      )
      track(anim)
    })

    if (inlinePhoto) {
      const targetW = window.innerWidth < 768 ? 96 : Math.min(232, Math.max(118, window.innerWidth * 0.14))
      const pAnim = inlinePhoto.animate(
        [
          { width: '18px', opacity: 0, clipPath: 'inset(0 46% 0 46% round 16px)' },
          { width: `${targetW}px`, opacity: 1, clipPath: 'inset(0 0% 0 0% round 16px)' },
        ],
        { duration: 1220, delay: 260, easing: EASE_EXPO, fill: 'forwards' },
      )
      track(pAnim)
    }

    heroSub.forEach((el, idx) => {
      el.style.opacity = '0'
      const sAnim = el.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0px)' },
        ],
        { duration: 900, delay: 420 + idx * 110, easing: EASE_EXPO, fill: 'forwards' },
      )
      track(sAnim)
    })
  }

  // 3. Preparación de líneas SVG orgánicas de energía que se dibujan con el scroll
  function initEnergyLines() {
    energyMeta = []
    document.querySelectorAll('path[data-energy-path]').forEach((path) => {
      let len = 400
      try {
        len = Math.max(1, path.getTotalLength())
      } catch (_) {}
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = isPaused() ? '0' : `${len}`
      const dotId = path.getAttribute('data-energy-dot')
      const dot = dotId ? document.getElementById(dotId) : null
      energyMeta.push({ path, len, dot })
    })
  }

  // 4. IntersectionObserver para revelados verticales (24px), tarjetas escalonadas y gráficas SVG
  function initScrollObservers() {
    const revealObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target
          obs.unobserve(el)
          if (isPaused()) {
            el.style.opacity = '1'
            el.style.transform = 'none'
            return
          }
          const anim = el.animate(
            [
              { opacity: 0, transform: 'translateY(24px)' },
              { opacity: 1, transform: 'translateY(0px)' },
            ],
            { duration: 840, easing: EASE_EXPO, fill: 'forwards' },
          )
          track(anim)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    document.querySelectorAll('.reveal-up').forEach((el) => {
      if (!isPaused()) el.style.opacity = '0'
      revealObs.observe(el)
    })

    const staggerObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const group = entry.target
          obs.unobserve(group)
          const items = Array.from(group.querySelectorAll('[data-stagger-item]'))
          items.forEach((item, idx) => {
            if (isPaused()) {
              item.style.opacity = '1'
              item.style.transform = 'none'
              return
            }
            const anim = item.animate(
              [
                { opacity: 0, transform: 'translateY(24px)' },
                { opacity: 1, transform: 'translateY(0px)' },
              ],
              { duration: 820, delay: idx * 75, easing: EASE_EXPO, fill: 'forwards' },
            )
            track(anim)
          })
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
    )

    document.querySelectorAll('[data-stagger-group]').forEach((group) => {
      if (!isPaused()) {
        group.querySelectorAll('[data-stagger-item]').forEach((item) => {
          item.style.opacity = '0'
        })
      }
      staggerObs.observe(group)
    })

    const chartObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const box = entry.target
          obs.unobserve(box)
          box.dataset.revealed = '1'
          if (!window.SolCharts) return
          if (box.dataset.chartKind === 'line') window.SolCharts.animateSvgLinesAndPoints(box)
          if (box.dataset.chartKind === 'bar') window.SolCharts.animateSvgBars(box)
        })
      },
      { threshold: 0.18 },
    )

    document.querySelectorAll('[data-chart-box]').forEach((box) => chartObs.observe(box))
  }

  // 5. Loop único con requestAnimationFrame para progreso, líneas de energía, capas solares, boceto->obra y parallax
  function updateOnScrollFrame() {
    rafPending = false
    const doc = document.documentElement
    const scrollTop = window.scrollY || doc.scrollTop || 0
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
    const globalProgress = Math.min(1, Math.max(0, scrollTop / maxScroll))

    // Barra fina superior siempre refleja la posición de lectura
    const bar = document.getElementById('scroll-progress-bar')
    if (bar) bar.style.transform = `scaleX(${globalProgress.toFixed(4)})`

    if (isPaused()) return

    const vh = window.innerHeight
    const isMobile = window.innerWidth < 768

    // Líneas orgánicas SVG de energía dibujándose con el avance del scroll
    energyMeta.forEach(({ path, len, dot }) => {
      const rect = path.getBoundingClientRect()
      const start = vh * 0.88
      const end = vh * 0.18
      const raw = (start - rect.top) / Math.max(1, start - end + rect.height * 0.65)
      const p = Math.min(1, Math.max(0, raw))
      path.style.strokeDashoffset = `${(len * (1 - p)).toFixed(1)}`
      if (dot && p > 0.02) {
        try {
          const pt = path.getPointAtLength(len * p)
          dot.setAttribute('cx', pt.x.toFixed(1))
          dot.setAttribute('cy', pt.y.toFixed(1))
          dot.style.opacity = '1'
        } catch (_) {}
      }
    })

    // Diagrama solar arquitectónico: capas que se separan suavemente durante el scroll
    const diagStage = document.getElementById('exploded-solar-stage')
    if (diagStage) {
      const rect = diagStage.getBoundingClientRect()
      const centerProgress = 1 - Math.abs(rect.top + rect.height / 2 - vh / 2) / (vh * 0.72)
      const spread = Math.min(1, Math.max(0, centerProgress))
      const factor = isMobile ? 0.45 : 1
      diagStage.querySelectorAll('[data-layer-offset]').forEach((layer) => {
        const targetOffset = Number(layer.getAttribute('data-layer-offset') || 0)
        const y = targetOffset * spread * factor
        layer.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
      })
    }

    // Transición estilo Tessel: boceto CAD -> composición fotográfica terminada
    const sketchStage = document.getElementById('sketch-transition-stage')
    const sketchRange = document.getElementById('sketch-compare-range')
    const finishedLayer = document.getElementById('sketch-finished-layer')
    const dividerLine = document.getElementById('sketch-divider-line')
    if (sketchStage && finishedLayer && (!sketchStage.dataset.manualOverride || sketchStage.dataset.manualOverride === '0')) {
      const rect = sketchStage.getBoundingClientRect()
      const raw = (vh * 0.82 - rect.top) / Math.max(1, vh * 0.58)
      const pct = Math.round(Math.min(92, Math.max(12, raw * 100)))
      finishedLayer.style.clipPath = `inset(0 ${100 - pct}% 0 0)`
      if (dividerLine) dividerLine.style.left = `${pct}%`
      if (sketchRange) sketchRange.value = String(pct)
    }

    // Parallax ligero en fotografías (desactivado en pantallas <768px)
    if (!isMobile) {
      document.querySelectorAll('[data-parallax]').forEach((img) => {
        const speed = Number(img.getAttribute('data-parallax') || 18)
        const rect = img.parentElement.getBoundingClientRect()
        const rel = (rect.top + rect.height / 2 - vh / 2) / vh
        const shift = Math.max(-28, Math.min(28, -rel * speed * 2))
        img.style.transform = `scale(1.06) translate3d(0, ${shift.toFixed(1)}px, 0)`
      })
    } else {
      document.querySelectorAll('[data-parallax]').forEach((img) => {
        img.style.transform = 'none'
      })
    }
  }

  function scheduleScrollFrame() {
    if (!rafPending) {
      rafPending = true
      window.requestAnimationFrame(updateOnScrollFrame)
    }
  }

  function initSketchManualControl() {
    const sketchStage = document.getElementById('sketch-transition-stage')
    const sketchRange = document.getElementById('sketch-compare-range')
    const finishedLayer = document.getElementById('sketch-finished-layer')
    const dividerLine = document.getElementById('sketch-divider-line')
    if (!sketchStage || !sketchRange || !finishedLayer) return

    sketchRange.addEventListener('input', (ev) => {
      sketchStage.dataset.manualOverride = '1'
      const pct = Number(ev.target.value)
      finishedLayer.style.clipPath = `inset(0 ${100 - pct}% 0 0)`
      if (dividerLine) dividerLine.style.left = `${pct}%`
    })
  }

  function init() {
    verifyFonts()
    initEnergyLines()
    initScrollObservers()
    initSketchManualControl()
    updatePauseUI()
    animateHeroEntrance()
    scheduleScrollFrame()

    window.addEventListener('scroll', scheduleScrollFrame, { passive: true })
    window.addEventListener('resize', () => {
      initEnergyLines()
      scheduleScrollFrame()
    })
    mediaReduced.addEventListener?.('change', updatePauseUI)

    const btn = document.getElementById('btn-pause-motion')
    if (btn) {
      btn.addEventListener('click', () => {
        manualPaused = !manualPaused
        updatePauseUI()
      })
    }
  }

  window.SolMotion = {
    isPaused,
    track,
    refreshEnergy: initEnergyLines,
    init,
  }
})()
