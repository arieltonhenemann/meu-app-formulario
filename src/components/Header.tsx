import React from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { toast } from '../shared/components/Toast';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Sessão encerrada.');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  if (!user) return null;

  return (
    <header style={{
      backgroundColor: '#fff',
      borderBottom: '2px solid #e9ecef',
      padding: '15px 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ fontSize: '24px' }}>📋</div>
          <h1 style={{
            color: '#333',
            fontSize: '24px',
            margin: 0,
            fontWeight: 'bold'
          }}>
            Vorx Solutions Tech
          </h1>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              👤 {user.displayName || user.email}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#666'
            }}>
              Logado
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            🚪 Sair
          </button>
        </div>
      </div>
    </header>
  );
};
