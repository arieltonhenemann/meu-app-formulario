// Tipos para gerenciar formulários salvos
import { OrdemServico } from './os';
import { OrdemServicoPON } from './pon';
import { OrdemServicoLINK } from './link';

export type StatusFormulario = 'pendente' | 'finalizado';
export type TipoFormulario = 'CTO' | 'PON' | 'LINK';

export interface FormularioSalvoBase {
  id: string;
  tipo: TipoFormulario;
  status: StatusFormulario;
  dataCriacao: string;
  dataModificacao: string;
  codigoOS: string;
}

export interface FormularioSalvoCTO extends FormularioSalvoBase {
  tipo: 'CTO';
  dados: OrdemServico;
}

export interface FormularioSalvoPON extends FormularioSalvoBase {
  tipo: 'PON';
  dados: OrdemServicoPON;
}

export interface FormularioSalvoLINK extends FormularioSalvoBase {
  tipo: 'LINK';
  dados: OrdemServicoLINK;
}

export type FormularioSalvo = FormularioSalvoCTO | FormularioSalvoPON | FormularioSalvoLINK;

// Funções auxiliares
export const criarFormularioSalvo = <T extends OrdemServico | OrdemServicoPON | OrdemServicoLINK>(
  tipo: TipoFormulario,
  dados: T
): FormularioSalvo => {
  const agora = new Date().toISOString();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  return {
    id,
    tipo,
    status: 'pendente',
    dataCriacao: agora,
    dataModificacao: agora,
    codigoOS: dados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
    dados
  } as FormularioSalvo;
};

export const obterCorStatus = (status: StatusFormulario): string => {
  switch (status) {
    case 'pendente':
      return '#ffc107';
    case 'finalizado':
      return '#28a745';
    default:
      return '#6c757d';
  }
};

export const obterCorTipo = (tipo: TipoFormulario): string => {
  switch (tipo) {
    case 'CTO':
      return '#007bff';
    case 'PON':
      return '#28a745';
    case 'LINK':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};
