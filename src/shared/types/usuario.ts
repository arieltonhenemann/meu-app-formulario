export interface UsuarioStatus {
  uid: string;
  email: string;
  displayName?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataCriacao: Date;
  dataAprovacao?: Date;
  motivoRejeicao?: string;
  aprovadoPor?: string; // UID do admin que aprovou
}

export interface SolicitacaoAprovacao {
  uid: string;
  email: string;
  displayName?: string;
  dataSolicitacao: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const criarUsuarioStatus = (
  uid: string, 
  email: string, 
  displayName?: string
): UsuarioStatus => {
  return {
    uid,
    email,
    displayName,
    status: 'pendente',
    dataCriacao: new Date()
  };
};
