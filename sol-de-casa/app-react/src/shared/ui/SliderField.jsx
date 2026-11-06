export default function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  porcentaje = false,
  unidad = '',
  ayuda = '',
}) {
  const mostrado = porcentaje ? Math.round(value * 10000) / 100 : value
  const minMostrado = porcentaje ? Math.round(min * 100) : min
  const maxMostrado = porcentaje ? Math.round(max * 100) : max
  const stepMostrado = porcentaje ? step * 100 : step
  const sufijo = porcentaje ? '%' : unidad

  const emitir = (raw) => {
    const n = Number(raw)
    if (Number.isNaN(n)) return
    const acotado = Math.min(maxMostrado, Math.max(minMostrado, n))
    onChange(porcentaje ? acotado / 100 : acotado)
  }

  return (
    <div className="slider-field">
      <div className="slider-top">
        <span className="slider-label">{label}</span>
        <div className="slider-input-wrap">
          <input
            type="number"
            className="editable-input"
            value={mostrado}
            min={minMostrado}
            max={maxMostrado}
            step={stepMostrado}
            onChange={(ev) => emitir(ev.target.value)}
          />
          {sufijo && <span className="unidad-chip">{sufijo}</span>}
        </div>
      </div>
      <input
        type="range"
        min={minMostrado}
        max={maxMostrado}
        step={stepMostrado}
        value={mostrado}
        onChange={(ev) => emitir(ev.target.value)}
      />
      {ayuda && <small className="slider-ayuda">{ayuda}</small>}
    </div>
  )
}

