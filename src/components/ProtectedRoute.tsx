import React from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { Login } from './Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 1s linear infinite'
          }}>
            ⚙️
          </div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>
            Carregando...
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Verificando autenticação
          </p>
        </div>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (user && user.isApproved === false) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            ⏳
          </div>
          <h2 style={{
            color: '#e67e22',
            marginBottom: '15px',
            fontSize: '24px'
          }}>
            Conta Pendente de Aprovação
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Olá <strong>{user.email}</strong>!<br />
            Sua conta foi criada com sucesso, mas precisa ser aprovada pelo administrador antes que você possa acessar o sistema.
          </p>
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '25px'
          }}>
            <p style={{
              margin: 0,
              color: '#856404',
              fontSize: '14px'
            }}>
              📧 <strong>O administrador foi notificado</strong> sobre sua solicitação de acesso e entrará em contato em breve.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={async () => {
                const { authService } = await import('../shared/services/authService');
                await authService.logout();
                window.location.reload();
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚪 Sair da Conta
            </button>
          </div>
          <p style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#999'
          }}>
            Status atual: <strong style={{ color: '#e67e22' }}>{user.statusInfo?.status || 'Pendente'}</strong><br />
            Data do registro: {user.statusInfo?.dataCriacao?.toLocaleDateString('pt-BR') || 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
