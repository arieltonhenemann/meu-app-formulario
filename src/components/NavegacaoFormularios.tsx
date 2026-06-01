import React from 'react';
import { useAuth } from '../shared/contexts/AuthContext';

export type TipoFormulario = 'CTO' | 'PON' | 'LINK' | 'ADEQUACAO';
export type TelaAtiva = TipoFormulario | 'GERENCIAR' | 'RELATORIOS' | 'LOGS' | 'ADMIN';

interface NavegacaoFormulariosProps {
  telaAtiva: TelaAtiva;
  onMudarTela: (tela: TelaAtiva) => void;
  modoEdicao?: boolean;
  onVoltar?: () => void;
}

export const NavegacaoFormularios: React.FC<NavegacaoFormulariosProps> = ({
  telaAtiva,
  onMudarTela,
  modoEdicao = false,
  onVoltar
}) => {
  const { isAdmin } = useAuth();

  const botoesBasicos = [
    { tipo: 'GERENCIAR' as TelaAtiva, label: '📋 Gerenciar', cor: '#6f42c1' },
    { tipo: 'CTO' as TipoFormulario, label: '🏢 CTO', cor: '#007bff' },
    { tipo: 'PON' as TipoFormulario, label: '📡 PON', cor: '#28a745' },
    { tipo: 'LINK' as TipoFormulario, label: '🔗 LINK', cor: '#dc3545' },
    { tipo: 'ADEQUACAO' as TipoFormulario, label: '🔧 ADEQUAÇÃO', cor: '#d4a30eff' }
  ];

  const botoesAdmin = [
    { tipo: 'RELATORIOS' as TelaAtiva, label: '📈 Relatórios', cor: '#20c997' },
    { tipo: 'LOGS' as TelaAtiva, label: '📋 Logs', cor: '#17a2b8' },
    { tipo: 'ADMIN' as TelaAtiva, label: '🛡️ Admin', cor: '#fd7e14' }
  ];

  const botoes = isAdmin ? [...botoesBasicos, ...botoesAdmin] : botoesBasicos;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      margin: '20px 0 30px 0',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {modoEdicao && onVoltar && (
        <button
          onClick={onVoltar}
          style={{
            padding: '12px 20px',
            border: '2px solid #6c757d',
            borderRadius: '8px',
            backgroundColor: '#6c757d',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginRight: '20px'
          }}
        >
          ← Voltar
        </button>
      )}

      {botoes.map((botao) => (
        <button
          key={botao.tipo}
          onClick={() => onMudarTela(botao.tipo)}
          style={{
            padding: '12px 24px',
            border: telaAtiva === botao.tipo ? `3px solid ${botao.cor}` : '2px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: telaAtiva === botao.tipo ? botao.cor : 'var(--bg-card)',
            color: telaAtiva === botao.tipo ? '#fff' : 'var(--text-main)',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '120px',
            boxShadow: telaAtiva === botao.tipo
              ? `0 4px 12px ${botao.cor}40`
              : '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {botao.label}
        </button>
      ))}

      {modoEdicao && (
        <div style={{
          marginLeft: '20px',
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 193, 7, 0.15)',
          border: '1px solid var(--status-pendente)',
          borderRadius: '6px',
          color: 'var(--status-pendente)',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✏️ Modo Edição
        </div>
      )}
    </div>
  );
};
