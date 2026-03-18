// Utilitário para gerar arquivos TXT dos formulários
import { OrdemServicoAdequacao } from "../types/adequacao";
import { OrdemServico } from "../types/os";
import { OrdemServicoPON } from "../types/pon";
import { OrdemServicoLINK } from "../types/link";
import { formatarData } from "./index";

export const gerarArquivoCTO = (dados: OrdemServico): string => {
  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - CTO
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString(
    "pt-BR"
  )}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || "Não informado"}
CTO: ${dados.cto || "Não informado"}
Região: ${dados.regiao || "Não informado"}
UPC ou APC: ${dados.upcOuApc || "Não informado"}
Splitter: ${dados.splitter || "Não informado"}
Identificada [S/N]: ${dados.identificada || "Não informado"}

MEDIÇÕES:
---------
Nível Antes: ${dados.nivelAntes || "Não informado"}
Nível Pos: ${dados.nivelPos || "Não informado"}

DESCRIÇÕES:
-----------
PROBLEMA: ${dados.problema || "Não informado"}

RESOLUÇÃO: ${dados.resolucao || "Não informado"}

MATERIAL UTILIZADO:
${dados.materialUtilizado || "Não informado"}

LOCALIZAÇÃO:
------------
Endereço: ${dados.endereco || "Não informado"}
Localização: ${dados.localizacao || "Não informado"}
===========================================
  `.trim();

  return conteudo;
};

export const gerarArquivoPON = (dados: OrdemServicoPON): string => {
  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - PON
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString(
    "pt-BR"
  )}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || "Não informado"}
PON: ${dados.pon || "Não informado"}
Região: ${dados.regiao || "Não informado"}
Placa: ${dados.placa || "Não informado"}
Porta: ${dados.porta || "Não informado"}
Clientes Afetados: ${dados.clientesAfetados || "Não informado"}
Média de Nível Pos: ${dados.mediaNivelPos || "Não informado"}

DESCRIÇÕES:
-----------
PROBLEMA: ${dados.problema || "Não informado"}

RESOLUÇÃO: ${dados.resolucao || "Não informado"}

MATERIAL UTILIZADO:
${dados.materialUtilizado || "Não informado"}

LOCALIZAÇÃO:
------------
Endereço: ${dados.endereco || "Não informado"}
Localização: ${dados.localizacao || "Não informado"}
===========================================
  `.trim();

  return conteudo;
};

export const gerarArquivoLINK = (dados: OrdemServicoLINK): string => {
  const linksTexto = dados.links
    .map(
      (link, index) => `
LINK ${index + 1}:
  Link: ${link.link || "Não informado"}
  Porta: ${link.porta || "Não informado"}
  Nível Antes: ${link.nivelAntes || "Não informado"}
  Nível Pos: ${link.nivelPos || "Não informado"}
  `
    )
    .join("\n");

  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - LINK
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString(
    "pt-BR"
  )}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || "Não informado"}

LINKS CONFIGURADOS (${dados.links.length}):
${linksTexto}

DESCRIÇÕES:
-----------
PROBLEMA: ${dados.problema || "Não informado"}

RESOLUÇÃO: ${dados.resolucao || "Não informado"}

MATERIAL UTILIZADO:
${dados.materialUtilizado || "Não informado"}
===========================================
  `.trim();

  return conteudo;
};

// Função para gerar arquivo TXT de Ordem de Serviço de Adequação

export const gerarArquivoADEQUACAO = (dados: OrdemServicoAdequacao): string => {
  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - ADEQUAÇÃO
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString(
    "pt-BR"
  )}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || "Não informado"}
Tipo de Serviço: ${dados.tipodeservico || "Não informado"}
Tipo de Fibra: ${dados.tipodefibra || "Não informado"}
Metragem Inicial: ${dados.metrageminicial || "Não informado"}
Metragem Final: ${dados.metragemfinal || "Não informado"}
Metragem Cordoalha: ${dados.metragemcordoalha || "Não informado"}
Metragem Total: ${dados.metragemtotal || "Não informado"}
Adequação: ${dados.adequacao || "Não informado"}
Cordoalha: ${dados.cordoalha || "Não informado"}

MEDIÇÕES:
---------
Lançamento de fo incluindo cruzeta com cordoalha: ${dados.caboaereo || "Não informado"}
Adequação em condomínio aereo e subterrâneo: ${dados.cabosubterraneo || "Não informado"}
Retirada de fo: ${dados.adequacao || "Não informado"}
Lançamento e espinamento de cabo e cordoalha em sobra técnica e cto p/poste: ${dados.cordoalha || "Não informado"}
Equipagem em troca de poste: ${dados.equipagem || "Não informado"}

DESCRIÇÕES:
-----------
PROBLEMA: ${dados.problema || "Não informado"}

TRECHO:
Ponta A: ${dados.pontoa || "Não informado"}
Ponto B: ${dados.pontob || "Não informado"}

RESOLUÇÃO: ${dados.resolucao || "Não informado"}

MATERIAL UTILIZADO:
${dados.materialutilizado || "Não informado"}

===========================================
  `.trim();

  return conteudo;
};
