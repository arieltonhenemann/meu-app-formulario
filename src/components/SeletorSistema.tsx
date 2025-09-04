import React from 'react';

interface SeletorSistemaProps {
  sistemaAtual: 'OS' | 'EQUIPAMENTOS';
  onMudarSistema: (sistema: 'OS' | 'EQUIPAMENTOS') => void;
}

export const SeletorSistema: React.FC<SeletorSistemaProps> = ({
  sistemaAtual,
  onMudarSistema
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 10001,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      border: '2px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <span style={{
          color: 'white',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          Sistema:
        </span>
        <button
          onClick={() => onMudarSistema('OS')}
          style={{
            background: sistemaAtual === 'OS' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'all 0.2s'
          }}
        >
          🔧 Ordem de Serviço
        </button>
        <button
          onClick={() => onMudarSistema('EQUIPAMENTOS')}
          style={{
            background: sistemaAtual === 'EQUIPAMENTOS' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'all 0.2s'
          }}
        >
          📱 Equipamentos
        </button>
      </div>
    </div>
  );
};
