import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', color: 'var(--accent-red)', background: 'var(--bg-primary)', minHeight: '100vh', fontFamily: 'var(--font-body)', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>⚠️ Something went wrong</h2>
          <pre style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', overflowX: 'auto', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', overflowX: 'auto', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', marginTop: '20px', fontSize: '0.8rem', lineHeight: '1.5' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

