// Serviço de compatibilidade que sempre funciona
import {
  FormularioSalvo,
  StatusFormulario,
  TipoFormulario,
  criarFormularioSalvo,
} from "../types/formularioSalvo";
import { OrdemServico } from "../types/os";
import { OrdemServicoPON } from "../types/pon";
import { OrdemServicoLINK } from "../types/link";
import { OrdemServicoAdequacao } from "../types/adequacao";

const STORAGE_KEY = "formularios_salvos";

class CompatibilityStorageService {
  // Obter todos os formulários
  obterTodos(): FormularioSalvo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const formularios = data ? JSON.parse(data) : [];
      console.log("📂 Formulários carregados:", formularios.length);
      return formularios;
    } catch (error) {
      console.error("Erro ao carregar formulários do localStorage:", error);
      return [];
    }
  }

  // Salvar formulário
  salvar<
    T extends
      | OrdemServico
      | OrdemServicoPON
      | OrdemServicoLINK
      | OrdemServicoAdequacao
  >(tipo: TipoFormulario, dados: T): FormularioSalvo {
    try {
      console.log("💾 Salvando formulário:", tipo, dados);

      const formulario = criarFormularioSalvo(tipo, dados);
      const formularios = this.obterTodos();

      formularios.unshift(formulario); // Adicionar no início

      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));

      console.log("✅ Formulário salvo com sucesso:", formulario.id);
      return formulario;
    } catch (error) {
      console.error("❌ Erro ao salvar formulário:", error);
      throw error;
    }
  }

  // Atualizar formulário existente
  atualizar(id: string, novosDados: any): boolean {
    try {
      const formularios = this.obterTodos();
      const index = formularios.findIndex((f) => f.id === id);

      if (index === -1) {
        console.warn("⚠️ Formulário não encontrado para atualização:", id);
        return false;
      }

      formularios[index] = {
        ...formularios[index],
        dados: novosDados,
        dataModificacao: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
      console.log("✅ Formulário atualizado:", id);
      return true;
    } catch (error) {
      console.error("❌ Erro ao atualizar formulário:", error);
      return false;
    }
  }

  // Atualizar status do formulário
  atualizarStatus(id: string, novoStatus: StatusFormulario): boolean {
    try {
      const formularios = this.obterTodos();
      const index = formularios.findIndex((f) => f.id === id);

      if (index === -1) {
        console.warn("⚠️ Formulário não encontrado para atualizar status:", id);
        return false;
      }

      formularios[index] = {
        ...formularios[index],
        status: novoStatus,
        dataModificacao: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
      console.log("✅ Status atualizado:", id, "->", novoStatus);
      return true;
    } catch (error) {
      console.error("❌ Erro ao atualizar status:", error);
      return false;
    }
  }

  // Obter formulário por ID
  obterPorId(id: string): FormularioSalvo | null {
    const formularios = this.obterTodos();
    return formularios.find((f) => f.id === id) || null;
  }

  // Obter formulários por tipo
  obterPorTipo(tipo: TipoFormulario): FormularioSalvo[] {
    const formularios = this.obterTodos();
    return formularios.filter((f) => f.tipo === tipo);
  }

  // Obter contagem de formulários por tipo
  obterContagemPorTipo(): { [key in TipoFormulario]?: number } {
    const formularios = this.obterTodos();
    return {
      CTO: formularios.filter((f) => f.tipo === "CTO").length,
      PON: formularios.filter((f) => f.tipo === "PON").length,
      LINK: formularios.filter((f) => f.tipo === "LINK").length,
      ADEQUACAO: formularios.filter((f) => f.tipo === "ADEQUACAO").length,
    };
  }
}

export default new CompatibilityStorageService();
