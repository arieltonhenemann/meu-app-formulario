// Utilitário para gerar arquivos TXT dos formulários
import { OrdemServicoAdequacao, ServicoAdequacao, obterLabelTipoServico } from "../types/adequacao";
import { OrdemServico } from "../types/os";
import { OrdemServicoPON, normalizarPON } from "../types/pon";
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

export const gerarArquivoPON = (dadosBrutos: OrdemServicoPON): string => {
  const dados = normalizarPON(dadosBrutos);

  const pontosTexto = dados.pontos
    .map(
      (ponto, index) => `
PON ${index + 1}:
  PON: ${ponto.pon || "Não informado"}
  Placa: ${ponto.placa || "Não informado"}
  Porta: ${ponto.porta || "Não informado"}
  `
    )
    .join("\n");

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
Região: ${dados.regiao || "Não informado"}
Clientes Afetados: ${dados.clientesAfetados || "Não informado"}
Média de Nível Pos: ${dados.mediaNivelPos || "Não informado"}

PONTOS PON (${dados.pontos.length}):
${pontosTexto}

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
Região: ${dados.regiao || "Não informado"}

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

const valorOuNaoInformado = (valor: string): string => valor || "Não informado";

const descreverServicoAdequacao = (servico: ServicoAdequacao, index: number): string => {
  const linhas: string[] = [
    `SERVIÇO ${index + 1}: ${obterLabelTipoServico(servico.tipo) || "Não informado"}`
  ];

  switch (servico.tipo) {
    case "LANCAMENTO":
      linhas.push(
        `  Tipo de Fibra: ${valorOuNaoInformado(servico.tipoFibra)}`,
        `  Metragem Inicial: ${valorOuNaoInformado(servico.metragemInicial)}`,
        `  Metragem Final: ${valorOuNaoInformado(servico.metragemFinal)}`,
        `  Metragem Cordoalha: ${valorOuNaoInformado(servico.metragemCordoalha)}`,
        `  Metragem Total: ${valorOuNaoInformado(servico.metragemTotal)}`,
        `  Ponto A: ${valorOuNaoInformado(servico.pontoA)}`,
        `  Ponto B: ${valorOuNaoInformado(servico.pontoB)}`
      );
      break;
    case "ADEQUACAO_CONDOMINIO":
      linhas.push(
        `  Condomínio: ${valorOuNaoInformado(servico.condominio)}`,
        `  Quantidade de Blocos: ${valorOuNaoInformado(servico.quantidadeBlocos)}`,
        `  Metragem Inicial: ${valorOuNaoInformado(servico.metragemInicial)}`,
        `  Metragem Final: ${valorOuNaoInformado(servico.metragemFinal)}`,
        `  Metragem Aérea: ${valorOuNaoInformado(servico.metragemAerea)}`,
        `  Metragem Subterrânea: ${valorOuNaoInformado(servico.metragemSubterranea)}`
      );
      break;
    case "ADEQUACAO_POSTE":
      linhas.push(
        `  Localização: ${valorOuNaoInformado(servico.localizacao)}`,
        `  Quantidade de Postes: ${valorOuNaoInformado(servico.quantidadePostes)}`
      );
      break;
    case "RETIRADA_CABO":
      linhas.push(
        `  Localização: ${valorOuNaoInformado(servico.localizacao)}`,
        `  Ponto A: ${valorOuNaoInformado(servico.pontoA)}`,
        `  Ponto B: ${valorOuNaoInformado(servico.pontoB)}`,
        `  Metragem Retirada: ${valorOuNaoInformado(servico.metragemRetirada)}`
      );
      break;
    case "ACAO_COPEL":
      linhas.push(
        `  Localização: ${valorOuNaoInformado(servico.localizacao)}`,
        `  Ponto A: ${valorOuNaoInformado(servico.pontoA)}`,
        `  Ponto B: ${valorOuNaoInformado(servico.pontoB)}`
      );
      break;
    case "TROCA_PLAQUETAS":
      linhas.push(
        `  Quantidade de Postes: ${valorOuNaoInformado(servico.quantidadePostes)}`,
        `  Região: ${valorOuNaoInformado(servico.regiao)}`
      );
      break;
    default:
      linhas.push("  Tipo de serviço não selecionado");
  }

  return linhas.join("\n");
};

export const gerarArquivoADEQUACAO = (dados: OrdemServicoAdequacao): string => {
  const servicosTexto = (dados.servicos || [])
    .map((servico, index) => descreverServicoAdequacao(servico, index))
    .join("\n\n");

  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - ADEQUAÇÃO
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString(
    "pt-BR"
  )}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${valorOuNaoInformado(dados.codigoOS)}
Região: ${valorOuNaoInformado(dados.regiao)}
Funcionário: ${valorOuNaoInformado(dados.funcionario)}
Data/Hora de Abertura: ${valorOuNaoInformado(dados.dataHoraAbertura)}

SERVIÇOS CONFIGURADOS (${(dados.servicos || []).length}):
${servicosTexto}

DESCRIÇÕES:
-----------
PROBLEMA: ${valorOuNaoInformado(dados.problema)}

RESOLUÇÃO: ${valorOuNaoInformado(dados.resolucao)}

MATERIAL UTILIZADO:
${valorOuNaoInformado(dados.materialutilizado)}

===========================================
  `.trim();

  return conteudo;
};
