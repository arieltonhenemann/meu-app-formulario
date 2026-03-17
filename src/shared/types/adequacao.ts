// Tipos específicos para Ordem de Serviço
export interface OrdemServicoAdequacao {
  codigoOS: string;
  regiao: string;
  tipodeservico: string;
  tipodefibra: string;
  metrageminicial: string;
  metragemfinal: string;
  metragemcordoalha: string;
  metragemtotal: string;
  problema: string;
  pontoa: string;
  pontob: string;
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
  metragemcordoalha: "",
  metragemtotal: "",
  problema: "",
  pontoa: "",
  pontob: "",
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
