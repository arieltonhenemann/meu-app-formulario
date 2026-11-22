import React from 'react';
import { useAuth } from '../../shared/contexts/AuthContext';

export type TipoFormulario = 'CTO' | 'PON' | 'LINK' | 'ADEQUACAO';
export type TelaAtiva = TipoFormulario | 'GERENCIAR' | 'RELATORIOS' | 'LOGS' | 'ADMIN';

interface NavegacaoFormulariosProps {
  telaAtiva: TelaAtiva;
  onMudarTela: (tela: TelaAtiva) => void;
  modoEdicao?: boolean;
  onVoltar?: () => void;
  codigoEdicao?: string;
}

interface ItemNav {
  tipo: TelaAtiva;
  label: string;
  icone: string;
  cor: string;
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  borderLeft: '3px solid transparent',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--sidebar-text, var(--text-main))',
  transition: 'background-color 0.18s ease, color 0.18s ease'
};

export const NavegacaoFormularios: React.FC<NavegacaoFormulariosProps> = ({
  telaAtiva,
  onMudarTela,
  modoEdicao = false,
  onVoltar,
  codigoEdicao
}) => {
  const { isAdmin } = useAuth();

  const itensOperacao: ItemNav[] = [
    { tipo: 'GERENCIAR', label: 'Gerenciar', icone: '📋', cor: '#6f42c1' },
    { tipo: 'CTO', label: 'CTO', icone: '🏢', cor: '#007bff' },
    { tipo: 'PON', label: 'PON', icone: '📡', cor: '#28a745' },
    { tipo: 'LINK', label: 'LINK', icone: '🔗', cor: '#dc3545' },
    { tipo: 'ADEQUACAO', label: 'Adequação', icone: '🔧', cor: '#b8860b' }
  ];

  const itensAnalise: ItemNav[] = [
    { tipo: 'RELATORIOS', label: 'Relatórios', icone: '📈', cor: '#20c997' },
    { tipo: 'LOGS', label: 'Logs', icone: '📜', cor: '#17a2b8' }
  ];

  const itensSistema: ItemNav[] = [
    { tipo: 'ADMIN', label: 'Admin', icone: '🛡️', cor: '#fd7e14' }
  ];

  const renderItem = (item: ItemNav) => {
    const ativo = telaAtiva === item.tipo;
    return (
      <button
        key={item.tipo}
        onClick={() => onMudarTela(item.tipo)}
        title={item.label}
        style={{
          ...itemStyle,
          borderLeftColor: ativo ? item.cor : 'transparent',
          backgroundColor: ativo ? `${item.cor}1f` : 'transparent',
          color: ativo ? item.cor : 'var(--text-main)'
        }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icone}</span>
        <span>{item.label}</span>
      </button>
    );
  };

  const labelAtiva = [...itensOperacao, ...itensAnalise, ...itensSistema]
    .find(item => item.tipo === telaAtiva)?.label ?? telaAtiva;

  return (
    <nav className="app-sidebar" aria-label="Navegação principal">
      <div className="nav-group">
        <div className="nav-group-title">Operação</div>
        {itensOperacao.map(renderItem)}
      </div>

      {isAdmin && (
        <>
          <div className="nav-group">
            <div className="nav-group-title">Análise</div>
            {itensAnalise.map(renderItem)}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">Sistema</div>
            {itensSistema.map(renderItem)}
          </div>
        </>
      )}

      {modoEdicao && (
        <div className="nav-edicao">
          <div className="nav-group-title">Em edição</div>
          <div className="nav-breadcrumb" title={`Gerenciar › ${labelAtiva}${codigoEdicao ? ` › ${codigoEdicao}` : ''}`}>
            <span>Gerenciar</span>
            <span className="nav-breadcrumb-sep">›</span>
            <strong>{labelAtiva}</strong>
            {codigoEdicao && (
              <>
                <span className="nav-breadcrumb-sep">›</span>
                <span>{codigoEdicao}</span>
              </>
            )}
          </div>
          {onVoltar && (
            <button onClick={onVoltar} className="nav-voltar">
              ← Voltar para a lista
            </button>
          )}
          <div className="nav-edit-badge">✏️ Modo Edição</div>
        </div>
      )}
    </nav>
  );
};
