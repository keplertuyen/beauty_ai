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
        <div style={{ padding: '40px 20px', color: '#D25E5E', background: '#F8F6F2', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px' }}>⚠️ Phát hiện lỗi Runtime trong React App:</h2>
          <pre style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', overflowX: 'auto', color: '#2D2520', border: '1px solid rgba(143, 117, 95, 0.12)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', overflowX: 'auto', color: 'rgba(45, 37, 32, 0.75)', border: '1px solid rgba(143, 117, 95, 0.12)', marginTop: '20px', fontSize: '0.8rem', lineHeight: '1.5' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 24px', background: 'linear-gradient(135deg, #8F755F, #B09B8A)', color: 'white', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tải lại trang
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

