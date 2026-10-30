import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.jsx'
import '@/shared/styles/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ maxWidth: 680, margin: '48px auto', padding: 24, background: '#fff', border: '1px solid #fecaca', borderRadius: 12 }}>
          <h2 style={{ marginTop: 0, color: '#991b1b' }}>Error al renderizar la interfaz</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fef2f2', padding: 12, borderRadius: 8 }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
