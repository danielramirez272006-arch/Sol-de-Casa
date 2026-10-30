export default function Card({ titulo, children }) {
  return (
    <section className="card">
      {titulo && <h2>{titulo}</h2>}
      {children}
    </section>
  )
}

