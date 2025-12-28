// Tipos para Ordem de Serviço PON
export interface OrdemServicoPON {
  codigoOS: string;
  pon: string;
  regiao: string;
  placa: string;
  porta: string;
  clientesAfetados: string;
  mediaNivelPos: string;
  problema: string;
  resolucao: string;
  materialUtilizado: string;
  endereco: string;
  localizacao: string;
}

export const criarPONVazia = (): OrdemServicoPON => ({
  codigoOS: "",
  pon: "",
  regiao: "",
  placa: "",
  porta: "",
  clientesAfetados: "",
  mediaNivelPos: "",
  problema: "",
  resolucao: "",
  materialUtilizado: "",
  endereco: "",
  localizacao: "",
});
