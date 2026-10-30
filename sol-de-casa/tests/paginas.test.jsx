import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ModeloProvider } from '@/app/ModeloContext.jsx'
import { PAGINAS } from '@/app/paginas.js'

describe('render de cada pestaña', () => {
  for (const p of PAGINAS) {
    it(p.titulo, () => {
      const html = renderToString(<ModeloProvider><p.Componente /></ModeloProvider>)
      expect(html.length).toBeGreaterThan(100)
    })
  }
})
