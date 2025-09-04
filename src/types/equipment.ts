// Enums para status dos equipamentos
export enum StatusEquipamento {
  DISPONIVEL = 'disponivel',
  EM_USO = 'em_uso',
  MANUTENCAO = 'manutencao',
  INDISPONIVEL = 'indisponivel'
}

// Interface para Funcionário
export interface Funcionario {
  id: string;
  nome: string;
  setor: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Notebook
export interface Notebook {
  id: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  configuracao: {
    processador: string;
    memoria: string;
    armazenamento: string;
    sistemaOperacional: string;
  };
  status: StatusEquipamento;
  funcionarioId?: string; // ID do funcionário vinculado (opcional)
  dataCompra: Date | null; // Data de compra pode ser null para equipamentos antigos
  valorCompra: number;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Celular
export interface Celular {
  id: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  imei: string;
  status: StatusEquipamento;
  funcionarioId?: string; // ID do funcionário vinculado (opcional)
  dataCompra: Date;
  valorCompra: number;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Número de Telefone
export interface NumeroTelefone {
  id: string;
  numero: string;
  operadora: string;
  plano: string;
  valorMensal: number;
  status: StatusEquipamento;
  funcionarioId?: string; // ID do funcionário vinculado (opcional)
  celularId?: string; // ID do celular vinculado (opcional)
  dataAtivacao: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para Vinculação (histórico de vinculações)
export interface Vinculacao {
  id: string;
  funcionarioId: string;
  equipamentoId: string;
  tipoEquipamento: 'notebook' | 'celular' | 'numero';
  dataVinculacao: Date;
  dataDesvinculacao?: Date;
  motivoDesvinculacao?: string;
  ativa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para visão completa do funcionário com equipamentos
export interface FuncionarioCompleto extends Funcionario {
  notebook?: Notebook;
  celular?: Celular;
  numeroTelefone?: NumeroTelefone;
}

// Enum para setores
export enum SetorFuncionario {
  ATENDIMENTO = 'Atendimento',
  ATENDIMENTO_JURIDICO = 'Atendimento Jurídico',
  RECEPCAO = 'Recepção',
  TECNICO = 'Técnico',
  TI = 'T.I',
  ADMINISTRATIVO = 'Administrativo',
  RH = 'RH',
  FINANCEIRO = 'Financeiro',
  SUPERVISAO = 'Supervisão',
  ALMOXARIFADO = 'Almoxarifado',
  VENDAS_EXTERNAS = 'Vendas Externas'
}

// Interface para formulários
export interface FuncionarioForm {
  nome: string;
  setor: string;
  ativo: boolean;
}

export interface NotebookForm {
  marca: string;
  modelo: string;
  numeroSerie: string;
  processador: string;
  memoria: string;
  armazenamento: string;
  sistemaOperacional: string;
  dataCompra: string;
  valorCompra: number;
  observacoes?: string;
}

export interface CelularForm {
  marca: string;
  modelo: string;
  numeroSerie?: string;
  imei: string;
  dataCompra: string;
  valorCompra: number;
  observacoes?: string;
}

export interface NumeroTelefoneForm {
  numero: string;
  operadora: string;
  plano: string;
  valorMensal: number;
  dataAtivacao: string;
  observacoes?: string;
}

// Interface para vinculação de equipamentos
export interface VinculacaoForm {
  funcionarioId: string;
  notebookId?: string;
  celularId?: string;
  numeroTelefoneId?: string;
}

// Interface para relatórios
export interface RelatorioEquipamento {
  totalNotebooks: number;
  notebooksDisponiveis: number;
  notebooksEmUso: number;
  totalCelulares: number;
  celularesDisponiveis: number;
  celularesEmUso: number;
  totalNumeros: number;
  numerosDisponiveis: number;
  numerosEmUso: number;
  totalFuncionarios: number;
  funcionariosComEquipamentos: number;
}
