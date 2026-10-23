import { formatarDataHora } from '../utils';

export const TIPOS_SERVICO_ADEQUACAO = [
  { valor: 'LANCAMENTO', label: 'Lançamento' },
  { valor: 'ADEQUACAO_CONDOMINIO', label: 'Adequação de condomínio' },
  { valor: 'ADEQUACAO_POSTE', label: 'Adequação de poste' },
  { valor: 'RETIRADA_CABO', label: 'Retirada de cabo' },
  { valor: 'ACAO_COPEL', label: 'Ação Copel' },
  { valor: 'TROCA_PLAQUETAS', label: 'Troca de plaquetas' },
] as const;

export type TipoServicoAdequacao = typeof TIPOS_SERVICO_ADEQUACAO[number]['valor'];

export const obterLabelTipoServico = (tipo: string): string => {
  return TIPOS_SERVICO_ADEQUACAO.find(item => item.valor === tipo)?.label || tipo;
};

export interface ServicoAdequacao {
  id: string;
  tipo: TipoServicoAdequacao | '';

  // Lançamento
  tipoFibra: string;
  metragemInicial: string;
  metragemFinal: string;
  metragemCordoalha: string;
  metragemTotal: string;
  pontoA: string;
  pontoB: string;

  // Adequação de condomínio
  condominio: string;
  quantidadeBlocos: string;
  metragemAerea: string;
  metragemSubterranea: string;

  // Adequação de poste, retirada de cabo, ação Copel e troca de plaquetas
  localizacao: string;
  quantidadePostes: string;
  metragemRetirada: string;

  // Troca de plaquetas
  regiao: string;
}

export const criarServicoAdequacao = (tipo: TipoServicoAdequacao | '' = ''): ServicoAdequacao => ({
  id: `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`,
  tipo,
  tipoFibra: '',
  metragemInicial: '',
  metragemFinal: '',
  metragemCordoalha: '',
  metragemTotal: '',
  pontoA: '',
  pontoB: '',
  condominio: '',
  quantidadeBlocos: '',
  metragemAerea: '',
  metragemSubterranea: '',
  localizacao: '',
  quantidadePostes: '',
  metragemRetirada: '',
  regiao: '',
});

// Tipos específicos para Ordem de Serviço
export interface OrdemServicoAdequacao {
  dataHoraAbertura: string;
  codigoOS: string;
  regiao: string;
  servicos: ServicoAdequacao[];
  problema: string;
  resolucao: string;
  materialutilizado: string;
  datainicio: string;
  datatermino: string;
  funcionario: string;

  // Campos legados mantidos para compatibilidade com formulários já salvos
  tipodeservico: string;
  tipodefibra: string;
  metrageminicial: string;
  metragemfinal: string;
  metragemcordoalha: string;
  metragemtotal: string;
  pontoa: string;
  pontob: string;
  caboaereo: string;
  cabosubterraneo: string;
  adequacao: string;
  cordoalha: string;
  equipagem: string;
}

const normalizarTexto = (valor?: string): string =>
  (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const inferirTipoServicoLegado = (dados: Partial<OrdemServicoAdequacao>): TipoServicoAdequacao | '' => {
  const texto = normalizarTexto(
    `${dados.tipodeservico || ''} ${dados.caboaereo || ''} ${dados.cabosubterraneo || ''} ${dados.cordoalha || ''} ${dados.equipagem || ''}`
  );

  if (texto.includes('COPEL')) return 'ACAO_COPEL';
  if (texto.includes('PLAQUETA')) return 'TROCA_PLAQUETAS';
  if (texto.includes('CONDOMINIO')) return 'ADEQUACAO_CONDOMINIO';
  if (texto.includes('RETIRADA')) return 'RETIRADA_CABO';
  if (texto.includes('POSTE')) return 'ADEQUACAO_POSTE';
  if (texto.includes('LANCAMENTO') || texto.includes('FIBRA') || texto.includes('CORDOALHA')) return 'LANCAMENTO';

  return '';
};

const criarServicoDeDadosLegados = (dados: Partial<OrdemServicoAdequacao>): ServicoAdequacao => {
  const tipo = inferirTipoServicoLegado(dados);
  const servico = criarServicoAdequacao(tipo);

  servico.tipoFibra = dados.tipodefibra || '';
  servico.metragemInicial = dados.metrageminicial || '';
  servico.metragemFinal = dados.metragemfinal || '';
  servico.metragemCordoalha = dados.metragemcordoalha || '';
  servico.metragemTotal = dados.metragemtotal || '';
  servico.pontoA = dados.pontoa || '';
  servico.pontoB = dados.pontob || '';
  servico.metragemAerea = dados.caboaereo || '';
  servico.metragemSubterranea = dados.cabosubterraneo || '';
  servico.localizacao = dados.pontoa || '';
  servico.metragemRetirada = dados.adequacao || '';
  servico.quantidadePostes = dados.equipagem || '';
  servico.regiao = dados.regiao || '';

  return servico;
};

// Função para criar uma O.S. de Adequação vazia
export const criarAdequacaoVazia = (): OrdemServicoAdequacao => ({
  dataHoraAbertura: formatarDataHora(),
  codigoOS: '',
  regiao: '',
  servicos: [criarServicoAdequacao()],
  problema: '',
  resolucao: '',
  materialutilizado: '',
  datainicio: '',
  datatermino: '',
  funcionario: '',
  tipodeservico: '',
  tipodefibra: '',
  metrageminicial: '',
  metragemfinal: '',
  metragemcordoalha: '',
  metragemtotal: '',
  pontoa: '',
  pontob: '',
  caboaereo: '',
  cabosubterraneo: '',
  adequacao: '',
  cordoalha: '',
  equipagem: '',
});

// Normaliza os dados ao abrir o formulário, inclusive convertendo o formato antigo
export const normalizarAdequacao = (dados?: Partial<OrdemServicoAdequacao>): OrdemServicoAdequacao => {
  const base = { ...criarAdequacaoVazia(), ...dados };

  const servicosExistentes = dados?.servicos;
  let servicos: ServicoAdequacao[];
  if (Array.isArray(servicosExistentes) && servicosExistentes.length > 0) {
    servicos = servicosExistentes.map(servico => ({
      ...criarServicoAdequacao(servico.tipo),
      ...servico,
    }));
  } else {
    servicos = [criarServicoDeDadosLegados(dados || {})];
  }

  return { ...base, servicos };
};
