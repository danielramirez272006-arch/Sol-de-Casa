import { createContext, useContext, useMemo, useState } from 'react'
import { SUPUESTOS_BASE, ESCENARIOS_BASE, calcular, conTecnicos, PLANES_INICIALES } from '@/domain'

const ModeloContext = createContext(null)

// Asigna un valor en una ruta tipo 'meta.contacto' sin mutar el original.
function asignar(obj, ruta, valor) {
  const [k, ...resto] = ruta.split('.')
  return { ...obj, [k]: resto.length ? asignar(obj[k], resto.join('.'), valor) : valor }
}

// Estado único de la app: supuestos y escenarios editables + resultados derivados.
export function ModeloProvider({ children }) {
  const [supuestos, setSupuestos] = useState(SUPUESTOS_BASE)
  const [escenarios, setEscenarios] = useState(ESCENARIOS_BASE)
  const [planes, setPlanes] = useState(PLANES_INICIALES)

  const resultados = useMemo(
    () => escenarios.map((e) => ({ ...e, r: calcular(e, supuestos) })),
    [escenarios, supuestos],
  )

  const value = {
    supuestos,
    // Supuestos con los técnicos extra ya aplicados (capacidad y costos fijos efectivos)
    efectivos: conTecnicos(supuestos),
    escenarios,
    planes,
    setPlanes,
    resultados,
    actualizarSupuesto: (ruta, valor) => setSupuestos((s) => asignar(s, ruta, valor)),
    actualizarEscenario: (id, cambios) =>
      setEscenarios((prev) => prev.map((e) => (e.id === id ? { ...e, ...cambios } : e))),
    cargarDatos: (nuevosSupuestos, nuevosEscenarios) => {
      setSupuestos(nuevosSupuestos)
      setEscenarios(nuevosEscenarios)
    },
    reiniciar: () => {
      setSupuestos(SUPUESTOS_BASE)
      setEscenarios(ESCENARIOS_BASE)
      setPlanes(PLANES_INICIALES)
    },
  }

  return <ModeloContext.Provider value={value}>{children}</ModeloContext.Provider>
}

export function useModelo() {
  const ctx = useContext(ModeloContext)
  if (!ctx) throw new Error('useModelo debe usarse dentro de <ModeloProvider>')
  return ctx
}
