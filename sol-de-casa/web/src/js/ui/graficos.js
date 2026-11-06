// Motor de gráficas SVG arquitectónicas con Web Animations API
// Las líneas se dibujan primero y los puntos emergen al terminar el trazo.
;(function () {
  const EASE_POWER4 = 'cubic-bezier(0.25, 1, 0.5, 1)'
  const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function showTooltip(ev, html) {
    const tip = document.getElementById('chart-tooltip')
    if (!tip) return
    tip.innerHTML = html
    tip.style.left = `${ev.clientX}px`
    tip.style.top = `${ev.clientY - 8}px`
    tip.style.opacity = '1'
  }

  function hideTooltip() {
    const tip = document.getElementById('chart-tooltip')
    if (tip) tip.style.opacity = '0'
  }

  function bindTooltips(container) {
    container.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('pointerenter', (ev) => showTooltip(ev, el.getAttribute('data-tip')))
      el.addEventListener('pointermove', (ev) => showTooltip(ev, el.getAttribute('data-tip')))
      el.addEventListener('pointerleave', hideTooltip)
    })
  }

  function animateSvgLinesAndPoints(container) {
    const paused = window.SolMotion && window.SolMotion.isPaused()
    const paths = Array.from(container.querySelectorAll('path.anim-line'))
    const points = Array.from(container.querySelectorAll('circle.anim-point'))

    if (paused) {
      paths.forEach((p) => {
        p.style.strokeDasharray = 'none'
        p.style.strokeDashoffset = '0'
      })
      points.forEach((pt) => {
        pt.style.opacity = '1'
        pt.style.transform = 'scale(1)'
      })
      return
    }

    points.forEach((pt) => {
      pt.style.opacity = '0'
      pt.style.transformBox = 'fill-box'
      pt.style.transformOrigin = 'center'
    })

    paths.forEach((path, sIdx) => {
      let len = 600
      try {
        len = Math.max(1, path.getTotalLength())
      } catch (_) {}
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len}`

      const anim = path.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 920, delay: sIdx * 90, easing: EASE_POWER4, fill: 'forwards' },
      )
      if (window.SolMotion) window.SolMotion.track(anim)

      const seriesId = path.getAttribute('data-series')
      const myPoints = points.filter((pt) => pt.getAttribute('data-series') === seriesId)

      anim.onfinish = () => {
        myPoints.forEach((pt, pIdx) => {
          const pAnim = pt.animate(
            [
              { opacity: 0, transform: 'scale(0.15)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            { duration: 420, delay: pIdx * 24, easing: EASE_EXPO, fill: 'forwards' },
          )
          if (window.SolMotion) window.SolMotion.track(pAnim)
        })
      }
    })
  }

  function animateSvgBars(container) {
    const paused = window.SolMotion && window.SolMotion.isPaused()
    const bars = Array.from(container.querySelectorAll('rect.anim-bar'))
    const labels = Array.from(container.querySelectorAll('text.anim-bar-label'))

    if (paused) {
      bars.forEach((b) => (b.style.transform = 'scaleY(1)'))
      labels.forEach((l) => (l.style.opacity = '1'))
      return
    }

    labels.forEach((l) => (l.style.opacity = '0'))
    bars.forEach((bar, idx) => {
      bar.style.transformBox = 'fill-box'
      bar.style.transformOrigin = 'center bottom'
      const anim = bar.animate(
        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        { duration: 760, delay: idx * 55, easing: EASE_EXPO, fill: 'forwards' },
      )
      if (window.SolMotion) window.SolMotion.track(anim)
      if (idx === bars.length - 1) {
        anim.onfinish = () => {
          labels.forEach((lbl, lIdx) => {
            const lAnim = lbl.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 340,
              delay: lIdx * 30,
              easing: EASE_EXPO,
              fill: 'forwards',
            })
            if (window.SolMotion) window.SolMotion.track(lAnim)
          })
        }
      }
    })
  }

  // Gráfica de líneas multi-serie en SVG nítido
  function renderLineChart(container, opts) {
    if (!container) return
    const {
      categories,
      series,
      height = 300,
      refLine = null,
      yFormatter = (v) => String(Math.round(v)),
      tipFormatter = (v) => String(v),
      showAllPoints = false,
    } = opts

    const W = 760
    const H = height
    const pad = { top: 24, right: 26, bottom: 36, left: 68 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom

    let vals = []
    series.forEach((s) => s.values.forEach((v) => { if (Number.isFinite(v)) vals.push(v) }))
    if (refLine && Number.isFinite(refLine.value)) vals.push(refLine.value)
    if (!vals.length) vals = [0, 100]

    let minY = Math.min(0, ...vals)
    let maxY = Math.max(...vals)
    if (maxY === minY) maxY = minY + 100
    const span = maxY - minY
    maxY += span * 0.08
    if (minY < 0) minY -= span * 0.06

    const xAt = (i) => pad.left + (categories.length <= 1 ? plotW / 2 : (i / (categories.length - 1)) * plotW)
    const yAt = (v) => pad.top + plotH - ((v - minY) / (maxY - minY)) * plotH

    const ticks = 5
    let gridSvg = ''
    for (let t = 0; t <= ticks; t++) {
      const val = minY + ((maxY - minY) * t) / ticks
      const y = yAt(val)
      gridSvg += `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="rgba(16,32,31,0.09)" stroke-width="1" />
        <text x="${pad.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#647A78" font-family="Inter, sans-serif" font-size="11" font-weight="500">${esc(yFormatter(val))}</text>
      `
    }

    const xStep = categories.length > 14 ? 2 : 1
    let xSvg = ''
    categories.forEach((cat, i) => {
      if (i % xStep !== 0 && i !== categories.length - 1) return
      const x = xAt(i)
      xSvg += `<text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="#647A78" font-family="Inter, sans-serif" font-size="11" font-weight="500">${esc(cat)}</text>`
    })

    let refSvg = ''
    if (refLine && Number.isFinite(refLine.value)) {
      const ry = yAt(refLine.value)
      refSvg = `
        <line x1="${pad.left}" y1="${ry.toFixed(1)}" x2="${W - pad.right}" y2="${ry.toFixed(1)}" stroke="${refLine.color || '#A63D33'}" stroke-width="1.5" stroke-dasharray="5 4" />
        <text x="${W - pad.right - 4}" y="${(ry - 6).toFixed(1)}" text-anchor="end" fill="${refLine.color || '#A63D33'}" font-family="Inter, sans-serif" font-size="11" font-weight="500">${esc(refLine.label || '')}</text>
      `
    }

    let pathsSvg = ''
    let pointsSvg = ''

    series.forEach((s, sIdx) => {
      const sid = `s${sIdx}`
      const pts = s.values.map((v, i) => [xAt(i), yAt(v), v, categories[i]])
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
      pathsSvg += `<path class="anim-line" data-series="${sid}" d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.4}" ${s.dashed ? 'stroke-dasharray="6 4"' : ''} stroke-linecap="round" stroke-linejoin="round" />`

      pts.forEach(([px, py, val, cat], i) => {
        const keep = showAllPoints || categories.length <= 8 || i === 0 || i === pts.length - 1 || i % 3 === 0
        if (!keep) return
        const tip = `<div class="ui-micro text-[#D9C7A6] mb-0.5">${esc(s.name)} · ${esc(cat)}</div><div class="font-medium text-white text-xs">${esc(tipFormatter(val))}</div>`
        pointsSvg += `<circle class="anim-point cursor-pointer" data-series="${sid}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${s.highlight ? 4.6 : 3.8}" fill="${s.color}" stroke="#EEF2F1" stroke-width="1.8" data-tip="${esc(tip)}" />`
      })
    })

    const legendHtml = series
      .map(
        (s) => `
      <span class="inline-flex items-center gap-2 ui-label text-[#425856]">
        <span class="inline-block w-3 h-0.5 rounded-full" style="background:${s.color}"></span>
        <span>${esc(s.name)}</span>
      </span>`,
      )
      .join('')

    container.innerHTML = `
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2">${legendHtml}</div>
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto overflow-visible select-none" role="img" aria-label="Gráfica de líneas">
        ${gridSvg}
        ${refSvg}
        ${pathsSvg}
        ${pointsSvg}
        ${xSvg}
      </svg>
    `

    bindTooltips(container)
    const reduced =
      (window.SolMotion && window.SolMotion.isPaused()) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (container.dataset.revealed === '1') {
      animateSvgLinesAndPoints(container)
    } else if (!reduced) {
      container.querySelectorAll('path.anim-line').forEach((path) => {
        let len = 600
        try {
          len = Math.max(1, path.getTotalLength())
        } catch (_) {}
        path.style.strokeDasharray = `${len}`
        path.style.strokeDashoffset = `${len}`
      })
      container.querySelectorAll('circle.anim-point').forEach((pt) => {
        pt.style.opacity = '0'
      })
    }
  }

  // Gráfica de barras agrupadas en SVG nítido
  function renderBarChart(container, opts) {
    if (!container) return
    const {
      categories,
      series,
      height = 280,
      refLine = null,
      yFormatter = (v) => String(Math.round(v)),
      tipFormatter = (v) => String(v),
      showValueLabels = false,
    } = opts

    const W = 720
    const H = height
    const pad = { top: 26, right: 22, bottom: 38, left: 62 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom

    let vals = [0]
    series.forEach((s) => s.values.forEach((v) => { if (Number.isFinite(v)) vals.push(v) }))
    if (refLine && Number.isFinite(refLine.value)) vals.push(refLine.value)
    const maxY = Math.max(10, ...vals) * 1.12

    const yAt = (v) => pad.top + plotH - (Math.max(0, v) / maxY) * plotH
    const baseLineY = yAt(0)

    let gridSvg = ''
    for (let t = 0; t <= 4; t++) {
      const val = (maxY * t) / 4
      const y = yAt(val)
      gridSvg += `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="rgba(16,32,31,0.09)" stroke-width="1" />
        <text x="${pad.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#647A78" font-family="Inter, sans-serif" font-size="11" font-weight="500">${esc(yFormatter(val))}</text>
      `
    }

    const groupW = plotW / Math.max(1, categories.length)
    const innerW = groupW * 0.68
    const barW = Math.min(48, (innerW / Math.max(1, series.length)) * 0.86)
    const gap = series.length > 1 ? (innerW - barW * series.length) / (series.length - 1) : 0

    let barsSvg = ''
    let xSvg = ''

    categories.forEach((cat, cIdx) => {
      const gx = pad.left + cIdx * groupW + (groupW - (barW * series.length + gap * Math.max(0, series.length - 1))) / 2
      const centerCatX = pad.left + cIdx * groupW + groupW / 2
      xSvg += `<text x="${centerCatX.toFixed(1)}" y="${H - 11}" text-anchor="middle" fill="#425856" font-family="Inter, sans-serif" font-size="11.5" font-weight="500">${esc(cat)}</text>`

      series.forEach((s, sIdx) => {
        const val = Math.max(0, s.values[cIdx] || 0)
        const bx = gx + sIdx * (barW + gap)
        const by = yAt(val)
        const bh = Math.max(1.5, baseLineY - by)
        const tip = `<div class="ui-micro text-[#D9C7A6] mb-0.5">${esc(cat)} · ${esc(s.name)}</div><div class="font-medium text-white text-xs">${esc(tipFormatter(val))}</div>`
        barsSvg += `<rect class="anim-bar cursor-pointer" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${s.color}" data-tip="${esc(tip)}" />`
        if (showValueLabels && val > 0) {
          barsSvg += `<text class="anim-bar-label" x="${(bx + barW / 2).toFixed(1)}" y="${(by - 6).toFixed(1)}" text-anchor="middle" fill="#10201F" font-family="Inter, sans-serif" font-size="10.5" font-weight="500">${esc(yFormatter(val))}</text>`
        }
      })
    })

    let refSvg = ''
    if (refLine && Number.isFinite(refLine.value)) {
      const ry = yAt(refLine.value)
      refSvg = `
        <line x1="${pad.left}" y1="${ry.toFixed(1)}" x2="${W - pad.right}" y2="${ry.toFixed(1)}" stroke="${refLine.color || '#D98A2B'}" stroke-width="1.8" stroke-dasharray="6 4" />
        <text x="${W - pad.right - 4}" y="${(ry - 6).toFixed(1)}" text-anchor="end" fill="${refLine.color || '#D98A2B'}" font-family="Inter, sans-serif" font-size="11" font-weight="500">${esc(refLine.label || '')}</text>
      `
    }

    const legendHtml = series
      .map(
        (s) => `
      <span class="inline-flex items-center gap-2 ui-label text-[#425856]">
        <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:${s.color}"></span>
        <span>${esc(s.name)}</span>
      </span>`,
      )
      .join('')

    container.innerHTML = `
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2">${legendHtml}</div>
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto overflow-visible select-none" role="img" aria-label="Gráfica de barras">
        ${gridSvg}
        ${barsSvg}
        ${refSvg}
        ${xSvg}
      </svg>
    `

    bindTooltips(container)
    const reduced =
      (window.SolMotion && window.SolMotion.isPaused()) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (container.dataset.revealed === '1') {
      animateSvgBars(container)
    } else if (!reduced) {
      container.querySelectorAll('rect.anim-bar').forEach((bar) => {
        bar.style.transformBox = 'fill-box'
        bar.style.transformOrigin = 'center bottom'
        bar.style.transform = 'scaleY(0)'
      })
      container.querySelectorAll('text.anim-bar-label').forEach((lbl) => {
        lbl.style.opacity = '0'
      })
    }
  }

  window.SolCharts = {
    renderLineChart,
    renderBarChart,
    animateSvgLinesAndPoints,
    animateSvgBars,
  }
})()
