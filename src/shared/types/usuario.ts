export interface UsuarioStatus {
  uid: string;
  email: string;
  displayName?: string | null;
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
    displayName: displayName || null, // Garantir que seja null em vez de undefined
    status: 'pendente',
    dataCriacao: new Date()
  };
};
