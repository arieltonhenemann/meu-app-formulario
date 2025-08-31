// Utilitário para gerar arquivos TXT dos formulários
import { OrdemServico } from '../types/os';
import { OrdemServicoPON } from '../types/pon';
import { OrdemServicoLINK } from '../types/link';
import { formatarData } from './index';

export const gerarArquivoCTO = (dados: OrdemServico): void => {
  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - CTO
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString('pt-BR')}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || 'Não informado'}
CTO: ${dados.cto || 'Não informado'}
Região: ${dados.regiao || 'Não informado'}
UPC ou APC: ${dados.upcOuApc || 'Não informado'}
Splitter: ${dados.splitter || 'Não informado'}
Identificada [S/N]: ${dados.identificada || 'Não informado'}

MEDIÇÕES:
---------
Nível Antes: ${dados.nivelAntes || 'Não informado'}
Nível Pos: ${dados.nivelPos || 'Não informado'}

DESCRIÇÕES:
-----------
PROBLEMA:
${dados.problema || 'Não informado'}

RESOLUÇÃO:
${dados.resolucao || 'Não informado'}

MATERIAL UTILIZADO:
${dados.materialUtilizado || 'Não informado'}

LOCALIZAÇÃO:
------------
Endereço: ${dados.endereco || 'Não informado'}
Localização: ${dados.localizacao || 'Não informado'}

===========================================
Arquivo gerado automaticamente pelo Sistema de O.S
===========================================
  `.trim();

  baixarArquivo(conteudo, `OS_CTO_${dados.codigoOS || 'SEM_CODIGO'}_${obterDataParaArquivo()}.txt`);
};

export const gerarArquivoPON = (dados: OrdemServicoPON): void => {
  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - PON
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString('pt-BR')}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || 'Não informado'}
PON: ${dados.pon || 'Não informado'}
Região: ${dados.regiao || 'Não informado'}
Clientes Afetados: ${dados.clientesAfetados || 'Não informado'}
Média de Nível Pos: ${dados.mediaNivelPos || 'Não informado'}

DESCRIÇÕES:
-----------
PROBLEMA:
${dados.problema || 'Não informado'}

RESOLUÇÃO:
${dados.resolucao || 'Não informado'}

MATERIAL UTILIZADO:
${dados.materialUtilizado || 'Não informado'}

LOCALIZAÇÃO:
------------
Endereço: ${dados.endereco || 'Não informado'}
Localização: ${dados.localizacao || 'Não informado'}

===========================================
Arquivo gerado automaticamente pelo Sistema de O.S
===========================================
  `.trim();

  baixarArquivo(conteudo, `OS_PON_${dados.codigoOS || 'SEM_CODIGO'}_${obterDataParaArquivo()}.txt`);
};

export const gerarArquivoLINK = (dados: OrdemServicoLINK): void => {
  const linksTexto = dados.links.map((link, index) => `
LINK ${index + 1}:
  Link: ${link.link || 'Não informado'}
  Porta: ${link.porta || 'Não informado'}
  Nível Antes: ${link.nivelAntes || 'Não informado'}
  Nível Pos: ${link.nivelPos || 'Não informado'}
  `).join('\n');

  const conteudo = `
===========================================
    ORDEM DE SERVIÇO - LINK
===========================================

Data/Hora: ${formatarData(new Date())} - ${new Date().toLocaleTimeString('pt-BR')}

INFORMAÇÕES GERAIS:
-------------------
Código da O.S: ${dados.codigoOS || 'Não informado'}

LINKS CONFIGURADOS (${dados.links.length}):
${linksTexto}

DESCRIÇÕES:
-----------
PROBLEMA:
${dados.problema || 'Não informado'}

RESOLUÇÃO:
${dados.resolucao || 'Não informado'}

MATERIAL UTILIZADO:
${dados.materialUtilizado || 'Não informado'}

===========================================
Arquivo gerado automaticamente pelo Sistema de O.S
===========================================
  `.trim();

  baixarArquivo(conteudo, `OS_LINK_${dados.codigoOS || 'SEM_CODIGO'}_${obterDataParaArquivo()}.txt`);
};

// Função auxiliar para fazer download do arquivo
const baixarArquivo = (conteudo: string, nomeArquivo: string): void => {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar memória
  URL.revokeObjectURL(url);
};

// Função auxiliar para obter data formatada para nome do arquivo
const obterDataParaArquivo = (): string => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  
  return `${ano}${mes}${dia}_${hora}${minuto}`;
};
