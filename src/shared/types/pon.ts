import { formatarDataHora } from '../utils';

// Tipos para Ordem de Serviço PON
export interface PontoPON {
  id: string;
  pon: string;
  placa: string;
  porta: string;
}

export interface OrdemServicoPON {
  dataHoraAbertura: string;
  codigoOS: string;
  /** Grupos repetíveis de PON / Placa / Porta. */
  pontos: PontoPON[];
  regiao: string;
  clientesAfetados: string;
  mediaNivelPos: string;
  problema: string;
  resolucao: string;
  materialUtilizado: string;
  endereco: string;
  localizacao: string;
  /** Campos antigos, mantidos apenas para ler O.S. salvas antes dos grupos. */
  pon?: string;
  placa?: string;
  porta?: string;
}

export const criarPontoPONVazio = (id?: string): PontoPON => ({
  id: id || Math.random().toString(36).substring(2) + Date.now().toString(36),
  pon: '',
  placa: '',
  porta: ''
});

export const criarPONVazia = (): OrdemServicoPON => ({
  dataHoraAbertura: formatarDataHora(),
  codigoOS: '',
  pontos: [criarPontoPONVazio()],
  regiao: '',
  clientesAfetados: '',
  mediaNivelPos: '',
  problema: '',
  resolucao: '',
  materialUtilizado: '',
  endereco: '',
  localizacao: ''
});

/**
 * Converte registros antigos (pon/placa/porta soltos) para o formato com grupos.
 * Quem já tem `pontos` continua igual.
 */
export const normalizarPON = (dados?: Partial<OrdemServicoPON>): OrdemServicoPON => {
  const base = criarPONVazia();
  if (!dados) return base;

  const { pontos, pon, placa, porta, ...resto } = dados;

  const pontosNormalizados = Array.isArray(pontos) && pontos.length > 0
    ? pontos.map(ponto => ({ ...criarPontoPONVazio(ponto.id), ...ponto }))
    : pon || placa || porta
      ? [{ ...criarPontoPONVazio(), pon: pon || '', placa: placa || '', porta: porta || '' }]
      : base.pontos;

  return { ...base, ...resto, pontos: pontosNormalizados };
};
