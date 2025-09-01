// Tipos específicos para Ordem de Serviço
export interface OrdemServico {
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
