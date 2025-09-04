// Tipos para sistema de auditoria/logs

export type TipoAcaoAuditoria = 
  | 'CRIAR_FORMULARIO'
  | 'EDITAR_FORMULARIO' 
  | 'EXCLUIR_FORMULARIO'
  | 'FINALIZAR_FORMULARIO'
  | 'REABRIR_FORMULARIO';

export type TipoFormularioAuditoria = 'CTO' | 'PON' | 'LINK';

export interface UsuarioAuditoria {
  uid: string;
  email: string;
  displayName?: string | null;
}

export interface DetalhesAcao {
  formularioId?: string;
  codigoOS?: string;
  tipoFormulario?: TipoFormularioAuditoria;
  statusAnterior?: string;
  statusNovo?: string;
  dadosAlterados?: any;
  observacoes?: string;
}

export interface LogAuditoria {
  id: string;
  acao: TipoAcaoAuditoria;
  usuario: UsuarioAuditoria;
  timestamp: string;
  detalhes: DetalhesAcao;
  ipAddress?: string;
  userAgent?: string;
}

// Função para criar um novo log de auditoria
export const criarLogAuditoria = (
  acao: TipoAcaoAuditoria,
  usuario: UsuarioAuditoria,
  detalhes: DetalhesAcao
): LogAuditoria => {
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  return {
    id,
    acao,
    usuario,
    timestamp: new Date().toISOString(),
    detalhes,
    ipAddress: 'N/A', // Em produção, seria obtido do servidor
    userAgent: navigator.userAgent
  };
};

// Função para obter ícone da ação
export const obterIconeAcao = (acao: TipoAcaoAuditoria): string => {
  switch (acao) {
    case 'CRIAR_FORMULARIO':
      return '➕';
    case 'EDITAR_FORMULARIO':
      return '✏️';
    case 'EXCLUIR_FORMULARIO':
      return '🗑️';
    case 'FINALIZAR_FORMULARIO':
      return '✅';
    case 'REABRIR_FORMULARIO':
      return '🔄';
    default:
      return '📝';
  }
};

// Função para obter cor da ação
export const obterCorAcao = (acao: TipoAcaoAuditoria): string => {
  switch (acao) {
    case 'CRIAR_FORMULARIO':
      return '#28a745';
    case 'EDITAR_FORMULARIO':
      return '#17a2b8';
    case 'EXCLUIR_FORMULARIO':
      return '#dc3545';
    case 'FINALIZAR_FORMULARIO':
      return '#28a745';
    case 'REABRIR_FORMULARIO':
      return '#ffc107';
    default:
      return '#6c757d';
  }
};

// Função para obter descrição amigável da ação
export const obterDescricaoAcao = (log: LogAuditoria): string => {
  const { acao, detalhes } = log;
  const codigo = detalhes.codigoOS || 'Sem código';
  const tipo = detalhes.tipoFormulario || '';
  
  switch (acao) {
    case 'CRIAR_FORMULARIO':
      return `Criou formulário ${tipo}: ${codigo}`;
    case 'EDITAR_FORMULARIO':
      return `Editou formulário ${tipo}: ${codigo}`;
    case 'EXCLUIR_FORMULARIO':
      return `Excluiu formulário ${tipo}: ${codigo}`;
    case 'FINALIZAR_FORMULARIO':
      return `Finalizou formulário ${tipo}: ${codigo}`;
    case 'REABRIR_FORMULARIO':
      return `Reabriu formulário ${tipo}: ${codigo}`;
    default:
      return `Ação desconhecida em: ${codigo}`;
  }
};
