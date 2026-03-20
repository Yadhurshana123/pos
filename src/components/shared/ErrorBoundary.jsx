import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#111', color: '#f8d7da' }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Something went wrong</div>
            <div style={{ marginBottom: 16 }}>{this.state.error?.message || 'An unexpected error occurred.'}</div>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
