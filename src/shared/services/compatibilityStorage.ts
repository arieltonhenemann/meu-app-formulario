// Serviço de compatibilidade que sempre funciona
import { FormularioSalvo, StatusFormulario, TipoFormulario, criarFormularioSalvo } from '../types/formularioSalvo';
import { OrdemServico } from '../types/os';
import { OrdemServicoPON } from '../types/pon';
import { OrdemServicoLINK } from '../types/link';

const STORAGE_KEY = 'formularios_salvos';

class CompatibilityStorageService {
  // Obter todos os formulários
  obterTodos(): FormularioSalvo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const formularios = data ? JSON.parse(data) : [];
      console.log('📂 Formulários carregados:', formularios.length);
      return formularios;
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
    try {
      console.log('💾 Salvando formulário:', tipo, dados);
      
      const formulario = criarFormularioSalvo(tipo, dados);
      const formularios = this.obterTodos();
      
      formularios.unshift(formulario); // Adicionar no início
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
      
      console.log('✅ Formulário salvo com sucesso:', formulario.id);
      return formulario;
    } catch (error) {
      console.error('❌ Erro ao salvar formulário:', error);
      throw error;
    }
  }

  // Atualizar formulário existente
  atualizar(id: string, novosDados: any): boolean {
    try {
      const formularios = this.obterTodos();
      const index = formularios.findIndex(f => f.id === id);
      
      if (index === -1) {
        console.warn('⚠️ Formulário não encontrado para atualização:', id);
        return false;
      }
      
      formularios[index] = {
        ...formularios[index],
        dados: novosDados,
        dataModificacao: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
      console.log('✅ Formulário atualizado:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar formulário:', error);
      return false;
    }
  }

  // Atualizar status do formulário
  atualizarStatus(id: string, novoStatus: StatusFormulario): boolean {
    try {
      const formularios = this.obterTodos();
      const index = formularios.findIndex(f => f.id === id);
      
      if (index === -1) {
        console.warn('⚠️ Formulário não encontrado para atualizar status:', id);
        return false;
      }
      
      formularios[index] = {
        ...formularios[index],
        status: novoStatus,
        dataModificacao: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
      console.log('✅ Status atualizado:', id, '->', novoStatus);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return false;
    }
  }

  // Obter formulário por ID
  obterPorId(id: string): FormularioSalvo | null {
    const formularios = this.obterTodos();
    return formularios.find(f => f.id === id) || null;
  }

  // Excluir formulário
  excluir(id: string): boolean {
    try {
      const formularios = this.obterTodos();
      const formulariosAtualizados = formularios.filter(f => f.id !== id);
      
      if (formulariosAtualizados.length === formularios.length) {
        console.warn('⚠️ Formulário não encontrado para exclusão:', id);
        return false;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formulariosAtualizados));
      console.log('🗑️ Formulário excluído:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir formulário:', error);
      return false;
    }
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
    
    const stats = {
      total: formularios.length,
      pendentes: formularios.filter(f => f.status === 'pendente').length,
      finalizados: formularios.filter(f => f.status === 'finalizado').length,
      porTipo: {
        CTO: formularios.filter(f => f.tipo === 'CTO').length,
        PON: formularios.filter(f => f.tipo === 'PON').length,
        LINK: formularios.filter(f => f.tipo === 'LINK').length
      }
    };
    
    console.log('📊 Estatísticas:', stats);
    return stats;
  }

  // Limpar todos os dados (usar com cuidado)
  limparTodos(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Todos os dados foram limpos');
  }

  // Para compatibilidade com Firebase
  estaOnline(): boolean {
    return false; // Sempre offline para testes
  }

  temDadosPendentes(): boolean {
    return false; // Sem sincronização para testes
  }
}

// Exportar instância única do serviço
export const compatibilityStorage = new CompatibilityStorageService();
