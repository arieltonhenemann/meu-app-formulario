import React from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { Login } from './Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
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

  // Se não está autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Se está autenticado, mostrar conteúdo protegido
  return <>{children}</>;
};
