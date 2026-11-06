// Semáforo de LTV:CAC. Umbrales = SUPUESTO nuestro (regla común: ≥3 sano, <1 pierde plata).
export function estadoLtvCac(v) {
  if (v == null) return 'gris'
  if (v >= 3) return 'verde'
  if (v >= 1) return 'amarillo'
  return 'rojo'
}

export default function Semaforo({ valor, children }) {
  return <span className={`semaforo ${estadoLtvCac(valor)}`}>{children}</span>
}

