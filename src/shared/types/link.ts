import { formatarDataHora } from '../utils';

// Tipos para Ordem de Serviço LINK
export interface LinkInfo {
  id: string;
  link: string;
  porta: string;
  nivelAntes: string;
  nivelPos: string;
}

export interface OrdemServicoLINK {
  dataHoraAbertura: string;
  codigoOS: string;
  regiao: string;
  links: LinkInfo[];
  problema: string;
  resolucao: string;
  materialUtilizado: string;
}

export const criarLinkVazio = (id?: string): LinkInfo => ({
  id: id || Math.random().toString(36).substring(2) + Date.now().toString(36),
  link: '',
  porta: '',
  nivelAntes: '',
  nivelPos: ''
});

export const criarLINKVazia = (): OrdemServicoLINK => ({
  dataHoraAbertura: formatarDataHora(),
  codigoOS: '',
  regiao: '',
  links: [criarLinkVazio()],
  problema: '',
  resolucao: '',
  materialUtilizado: ''
});
