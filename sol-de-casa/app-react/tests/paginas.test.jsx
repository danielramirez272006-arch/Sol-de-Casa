import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from '@/app/App.jsx'
import { ModeloProvider } from '@/app/ModeloContext.jsx'
import { PAGINAS } from '@/app/paginas.js'

describe('render de cada pestaña y App completa', () => {
  it('App completa con Header y Tabs', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Sol de Casa')
  })
  for (const p of PAGINAS) {
    it(p.titulo, () => {
      const html = renderToString(<ModeloProvider><p.Componente /></ModeloProvider>)
      expect(html.length).toBeGreaterThan(100)
    })
  }
})
