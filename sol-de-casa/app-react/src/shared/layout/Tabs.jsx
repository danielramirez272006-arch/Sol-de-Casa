export default function Tabs({ paginas, activa, onChange }) {
  return (
    <nav className="tabs">
      {paginas.map((p) => (
        <button key={p.id} className={p.id === activa ? 'active' : ''} onClick={() => onChange(p.id)}>
          {p.titulo}
        </button>
      ))}
    </nav>
  )
}

