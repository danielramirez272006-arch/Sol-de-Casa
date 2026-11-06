import { useState } from 'react'
import Header from '@/shared/layout/Header.jsx'
import Tabs from '@/shared/layout/Tabs.jsx'
import { ModeloProvider, useModelo } from './ModeloContext.jsx'
import { PAGINAS } from './paginas.js'

function Shell() {
  const { reiniciar } = useModelo()
  const [activa, setActiva] = useState(PAGINAS[0].id)
  const { Componente } = PAGINAS.find((p) => p.id === activa)

  return (
    <div className="app">
      <Header onReiniciar={reiniciar} />
      <Tabs paginas={PAGINAS} activa={activa} onChange={setActiva} />
      <main>
        <Componente />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ModeloProvider>
      <Shell />
    </ModeloProvider>
  )
}

