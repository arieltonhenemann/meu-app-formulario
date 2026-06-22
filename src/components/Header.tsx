import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { toast } from '../shared/components/Toast';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
      backgroundColor: 'var(--bg-card)',
      borderBottom: '2px solid var(--border-color)',
      padding: '15px 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      color: 'var(--text-main)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
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
            color: 'var(--text-main)',
            fontSize: '24px',
            margin: 0,
            fontWeight: 'bold'
          }}>
            Codryx Tech
          </h1>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
              boxSizing: 'border-box'
            }}
            title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--text-main)'
            }}>
              👤 {user.displayName || user.email}
            </span>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)'
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
