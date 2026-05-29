import { auditoriaService } from '../services/auditoriaService';
import type { TipoAcaoAuditoria, UsuarioAuditoria } from '../types/auditoria';

export const criarUsuarioAuditoria = (user: { uid: string; email?: string | null; displayName?: string | null } | null): UsuarioAuditoria | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName,
  };
};

export const registrarAcaoAuditoria = async (
  user: { uid: string; email?: string | null; displayName?: string | null } | null,
  acao: TipoAcaoAuditoria,
  detalhes: Record<string, unknown>,
): Promise<void> => {
  const usuario = criarUsuarioAuditoria(user);
  if (!usuario) return;

  try {
    await auditoriaService.registrarAcao(acao, usuario, detalhes);
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};
