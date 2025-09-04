import React from 'react';

interface TelaSelecionarSistemaProps {
  onSelecionarSistema: (sistema: 'OS' | 'EQUIPAMENTOS') => void;
}

export const TelaSelecionarSistema: React.FC<TelaSelecionarSistemaProps> = ({
  onSelecionarSistema
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '60px 40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '15px',
            fontWeight: '700'
          }}>
            🎛️ Seleção de Sistema
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '10px'
          }}>
            Bem-vindo, Administrador!
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#888',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            Escolha qual sistema deseja acessar hoje:
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Botão Sistema de Ordem de Serviço */}
          <button
            onClick={() => onSelecionarSistema('OS')}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '15px',
              padding: '40px 30px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)',
              transform: 'translateY(0)',
              fontSize: '1rem',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(79, 172, 254, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.3)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔧</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>
              Sistema de Ordem de Serviço
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Gerencie ordens de serviço técnico CTO, PON e LINK
            </p>
          </button>

          {/* Botão Sistema de Equipamentos */}
          <button
            onClick={() => onSelecionarSistema('EQUIPAMENTOS')}
            style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              borderRadius: '15px',
              padding: '40px 30px',
              color: '#333',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(168, 237, 234, 0.3)',
              transform: 'translateY(0)',
              fontSize: '1rem',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 237, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.3)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📱</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>
              Sistema de Equipamentos
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              Cadastre e gerencie notebooks, celulares e funcionários
            </p>
          </button>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(103, 126, 234, 0.1)',
          borderRadius: '10px',
          marginTop: '30px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: '#666'
          }}>
            💡 <strong>Dica:</strong> Você pode alternar entre os sistemas a qualquer momento através do painel administrativo.
          </p>
        </div>
      </div>
    </div>
  );
};
