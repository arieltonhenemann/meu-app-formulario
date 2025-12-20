// Tipos específicos para Ordem de Serviço
export interface OrdemServicoAdequacao {
  codigoOS: string;
  regiao: string;
  tipodeservico: string;
  tipodefibra: string;
  metrageminicial: string;
  metragemfinal: string;
  metragemtotal: string;
  problema: string;
  resolucao: string;
  materialutilizado: string;
  datainicio: string;
  datatermino: string;
  funcionario: string;
  caboaereo: string;
  cabosubterraneo: string;
  adequacao: string;
  cordoalha: string;
}

// Função para criar uma O.S. de Adequação vazia
export const criarAdequacaoVazia = (): OrdemServicoAdequacao => ({
  codigoOS: "",
  regiao: "",
  tipodeservico: "",
  tipodefibra: "",
  metrageminicial: "",
  metragemfinal: "",
  metragemtotal: "",
  problema: "",
  resolucao: "",
  materialutilizado: "",
  datainicio: "",
  datatermino: "",
  funcionario: "",
  caboaereo: "",
  cabosubterraneo: "",
  adequacao: "",
  cordoalha: "",
});
