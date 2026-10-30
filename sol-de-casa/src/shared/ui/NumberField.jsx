export default function NumberField({ label, value, onChange, step = 1, min = 0, porcentaje = false, unidad }) {
  const mostrado = porcentaje ? Math.round(value * 10000) / 100 : value
  return (
    <label className="field">
      {label && (
        <span>
          {label}
          {unidad ? ` (${porcentaje ? '%' : unidad})` : porcentaje ? ' (%)' : ''}
        </span>
      )}
      <input
        type="number"
        className="editable-input"
        value={mostrado}
        step={porcentaje ? 1 : step}
        min={min}
        onChange={(ev) => onChange(porcentaje ? Number(ev.target.value) / 100 : Number(ev.target.value))}
      />
    </label>
  )
}
