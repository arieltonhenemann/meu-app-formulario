import { formatarDataHora } from '../utils';

// Tipos específicos para Ordem de Serviço
export interface OrdemServico {
  dataHoraAbertura: string;
  codigoOS: string;
  cto: string;
  regiao: string;
  upcOuApc: string;
  splitter: string;
  identificada: 'S' | 'N' | '';
  nivelAntes: string;
  nivelPos: string;
  problema: string;
  resolucao: string;
  materialUtilizado: string;
  endereco: string;
  localizacao: string;
}

export const criarOSVazia = (): OrdemServico => ({
  dataHoraAbertura: formatarDataHora(),
  codigoOS: '',
  cto: '',
  regiao: '',
  upcOuApc: '',
  splitter: '',
  identificada: '',
  nivelAntes: '',
  nivelPos: '',
  problema: '',
  resolucao: '',
  materialUtilizado: '',
  endereco: '',
  localizacao: ''
});
