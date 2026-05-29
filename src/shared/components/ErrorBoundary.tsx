import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro não capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚨</div>
            <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>
              Algo deu errado
            </h2>
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '100px',
                marginBottom: '20px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
