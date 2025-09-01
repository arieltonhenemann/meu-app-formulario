// Serviço para gerenciar formulários salvos no localStorage
import { FormularioSalvo, StatusFormulario, TipoFormulario, criarFormularioSalvo } from '../types/formularioSalvo';
import { OrdemServico } from '../types/os';
import { OrdemServicoPON } from '../types/pon';
import { OrdemServicoLINK } from '../types/link';

const STORAGE_KEY = 'formularios_salvos';

class FormularioStorageService {
  // Obter todos os formulários salvos
  obterTodos(): FormularioSalvo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar formulários do localStorage:', error);
      return [];
    }
  }

  // Salvar formulário
  salvar<T extends OrdemServico | OrdemServicoPON | OrdemServicoLINK>(
    tipo: TipoFormulario,
    dados: T
  ): FormularioSalvo {
    const formulario = criarFormularioSalvo(tipo, dados);
    const formularios = this.obterTodos();
    
    formularios.push(formulario);
    this.salvarTodos(formularios);
    
    return formulario;
  }

  // Atualizar formulário existente
  atualizar(id: string, novosDados: any): boolean {
    const formularios = this.obterTodos();
    const index = formularios.findIndex(f => f.id === id);
    
    if (index === -1) return false;
    
    formularios[index] = {
      ...formularios[index],
      dados: novosDados,
      dataModificacao: new Date().toISOString()
    };
    
    this.salvarTodos(formularios);
    return true;
  }

  // Atualizar status do formulário
  atualizarStatus(id: string, novoStatus: StatusFormulario): boolean {
    const formularios = this.obterTodos();
    const index = formularios.findIndex(f => f.id === id);
    
    if (index === -1) return false;
    
    formularios[index] = {
      ...formularios[index],
      status: novoStatus,
      dataModificacao: new Date().toISOString()
    };
    
    this.salvarTodos(formularios);
    return true;
  }

  // Obter formulário por ID
  obterPorId(id: string): FormularioSalvo | null {
    const formularios = this.obterTodos();
    return formularios.find(f => f.id === id) || null;
  }

  // Excluir formulário
  excluir(id: string): boolean {
    const formularios = this.obterTodos();
    const formulariosAtualizados = formularios.filter(f => f.id !== id);
    
    if (formulariosAtualizados.length === formularios.length) {
      return false; // Não encontrou o formulário
    }
    
    this.salvarTodos(formulariosAtualizados);
    return true;
  }

  // Filtrar por status
  filtrarPorStatus(status: StatusFormulario): FormularioSalvo[] {
    return this.obterTodos().filter(f => f.status === status);
  }

  // Filtrar por tipo
  filtrarPorTipo(tipo: TipoFormulario): FormularioSalvo[] {
    return this.obterTodos().filter(f => f.tipo === tipo);
  }

  // Obter estatísticas
  obterEstatisticas() {
    const formularios = this.obterTodos();
    
    return {
      total: formularios.length,
      pendentes: formularios.filter(f => f.status === 'pendente').length,
      finalizados: formularios.filter(f => f.status === 'finalizado').length,
      porTipo: {
        CTO: formularios.filter(f => f.tipo === 'CTO').length,
        PON: formularios.filter(f => f.tipo === 'PON').length,
        LINK: formularios.filter(f => f.tipo === 'LINK').length
      }
    };
  }

  // Limpar todos os dados (usar com cuidado)
  limparTodos(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Método privado para salvar no localStorage
  private salvarTodos(formularios: FormularioSalvo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
    } catch (error) {
      console.error('Erro ao salvar formulários no localStorage:', error);
    }
  }
}

// Exportar instância única do serviço
export const formularioStorage = new FormularioStorageService();
