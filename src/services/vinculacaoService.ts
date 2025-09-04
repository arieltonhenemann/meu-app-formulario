import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Vinculacao, 
  VinculacaoForm, 
  FuncionarioCompleto,
  RelatorioEquipamento 
} from '../types/equipment';
import { FuncionarioService } from './funcionarioService';
import { NotebookService } from './notebookService';
import { CelularService } from './celularService';
import { NumeroTelefoneService } from './numeroTelefoneService';

const COLLECTION_NAME = 'vinculacoes';

export class VinculacaoService {
  // Vincular equipamentos a funcionário
  static async vincularEquipamentos(dadosVinculacao: VinculacaoForm): Promise<void> {
    try {
      const batch = writeBatch(db);
      const agora = new Date();

      // Verificar se funcionário existe
      const funcionario = await FuncionarioService.buscarFuncionarioPorId(dadosVinculacao.funcionarioId);
      if (!funcionario) {
        throw new Error('Funcionário não encontrado');
      }

      // Vincular notebook se especificado
      if (dadosVinculacao.notebookId) {
        const notebook = await NotebookService.buscarNotebookPorId(dadosVinculacao.notebookId);
        if (!notebook) {
          throw new Error('Notebook não encontrado');
        }
        if (notebook.funcionarioId) {
          throw new Error('Notebook já está vinculado a outro funcionário');
        }

        await NotebookService.vincularNotebook(dadosVinculacao.notebookId, dadosVinculacao.funcionarioId);
        
        // Criar registro de vinculação
        await addDoc(collection(db, COLLECTION_NAME), {
          funcionarioId: dadosVinculacao.funcionarioId,
          equipamentoId: dadosVinculacao.notebookId,
          tipoEquipamento: 'notebook',
          dataVinculacao: agora,
          ativa: true,
          createdAt: agora,
          updatedAt: agora
        });
      }

      // Vincular celular se especificado
      if (dadosVinculacao.celularId) {
        const celular = await CelularService.buscarCelularPorId(dadosVinculacao.celularId);
        if (!celular) {
          throw new Error('Celular não encontrado');
        }
        if (celular.funcionarioId) {
          throw new Error('Celular já está vinculado a outro funcionário');
        }

        await CelularService.vincularCelular(dadosVinculacao.celularId, dadosVinculacao.funcionarioId);
        
        // Criar registro de vinculação
        await addDoc(collection(db, COLLECTION_NAME), {
          funcionarioId: dadosVinculacao.funcionarioId,
          equipamentoId: dadosVinculacao.celularId,
          tipoEquipamento: 'celular',
          dataVinculacao: agora,
          ativa: true,
          createdAt: agora,
          updatedAt: agora
        });
      }

      // Vincular número se especificado
      if (dadosVinculacao.numeroTelefoneId) {
        const numero = await NumeroTelefoneService.buscarNumeroPorId(dadosVinculacao.numeroTelefoneId);
        if (!numero) {
          throw new Error('Número de telefone não encontrado');
        }
        if (numero.funcionarioId) {
          throw new Error('Número já está vinculado a outro funcionário');
        }

        await NumeroTelefoneService.vincularNumero(
          dadosVinculacao.numeroTelefoneId, 
          dadosVinculacao.funcionarioId,
          dadosVinculacao.celularId // Se houver celular, vincula também
        );
        
        // Criar registro de vinculação
        await addDoc(collection(db, COLLECTION_NAME), {
          funcionarioId: dadosVinculacao.funcionarioId,
          equipamentoId: dadosVinculacao.numeroTelefoneId,
          tipoEquipamento: 'numero',
          dataVinculacao: agora,
          ativa: true,
          createdAt: agora,
          updatedAt: agora
        });
      }

    } catch (error) {
      console.error('Erro ao vincular equipamentos:', error);
      throw error;
    }
  }

  // Desvincular todos os equipamentos de um funcionário
  static async desvincularTodosEquipamentos(funcionarioId: string, motivo?: string): Promise<void> {
    try {
      const agora = new Date();

      // Buscar todas as vinculações ativas do funcionário
      const vinculacoesAtivas = await this.buscarVinculacoesPorFuncionario(funcionarioId, true);

      for (const vinculacao of vinculacoesAtivas) {
        // Desvincular baseado no tipo
        switch (vinculacao.tipoEquipamento) {
          case 'notebook':
            await NotebookService.desvincularNotebook(vinculacao.equipamentoId);
            break;
          case 'celular':
            await CelularService.desvincularCelular(vinculacao.equipamentoId);
            break;
          case 'numero':
            await NumeroTelefoneService.desvincularNumero(vinculacao.equipamentoId);
            break;
        }

        // Atualizar registro de vinculação
        const docRef = doc(db, COLLECTION_NAME, vinculacao.id);
        await updateDoc(docRef, {
          dataDesvinculacao: agora,
          motivoDesvinculacao: motivo || '',
          ativa: false,
          updatedAt: agora
        });
      }

    } catch (error) {
      console.error('Erro ao desvincular equipamentos:', error);
      throw new Error('Falha ao desvincular equipamentos');
    }
  }

  // Desvincular equipamento específico
  static async desvincularEquipamento(equipamentoId: string, tipoEquipamento: 'notebook' | 'celular' | 'numero', motivo?: string): Promise<void> {
    try {
      const agora = new Date();

      // Desvincular baseado no tipo
      switch (tipoEquipamento) {
        case 'notebook':
          await NotebookService.desvincularNotebook(equipamentoId);
          break;
        case 'celular':
          await CelularService.desvincularCelular(equipamentoId);
          break;
        case 'numero':
          await NumeroTelefoneService.desvincularNumero(equipamentoId);
          break;
      }

      // Buscar e atualizar registro de vinculação
      const q = query(
        collection(db, COLLECTION_NAME),
        where('equipamentoId', '==', equipamentoId),
        where('tipoEquipamento', '==', tipoEquipamento),
        where('ativa', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const vinculacaoDoc = querySnapshot.docs[0];
        const docRef = doc(db, COLLECTION_NAME, vinculacaoDoc.id);
        await updateDoc(docRef, {
          dataDesvinculacao: agora,
          motivoDesvinculacao: motivo || '',
          ativa: false,
          updatedAt: agora
        });
      }

    } catch (error) {
      console.error('Erro ao desvincular equipamento:', error);
      throw new Error('Falha ao desvincular equipamento');
    }
  }

  // Buscar funcionário com todos os equipamentos
  static async buscarFuncionarioComEquipamentos(funcionarioId: string): Promise<FuncionarioCompleto | null> {
    try {
      const funcionario = await FuncionarioService.buscarFuncionarioPorId(funcionarioId);
      if (!funcionario) {
        return null;
      }

      // Buscar equipamentos vinculados
      const [notebook, celular, numeroTelefone] = await Promise.all([
        NotebookService.buscarNotebookPorFuncionario(funcionarioId),
        CelularService.buscarCelularPorFuncionario(funcionarioId),
        NumeroTelefoneService.buscarNumeroPorFuncionario(funcionarioId)
      ]);

      return {
        ...funcionario,
        notebook: notebook || undefined,
        celular: celular || undefined,
        numeroTelefone: numeroTelefone || undefined
      };

    } catch (error) {
      console.error('Erro ao buscar funcionário com equipamentos:', error);
      throw new Error('Falha ao carregar dados do funcionário');
    }
  }

  // Buscar todos os funcionários com equipamentos
  static async buscarTodosFuncionariosComEquipamentos(): Promise<FuncionarioCompleto[]> {
    try {
      const funcionarios = await FuncionarioService.buscarTodosFuncionarios();
      const funcionariosCompletos: FuncionarioCompleto[] = [];

      for (const funcionario of funcionarios) {
        const funcionarioCompleto = await this.buscarFuncionarioComEquipamentos(funcionario.id);
        if (funcionarioCompleto) {
          funcionariosCompletos.push(funcionarioCompleto);
        }
      }

      return funcionariosCompletos;

    } catch (error) {
      console.error('Erro ao buscar funcionários com equipamentos:', error);
      throw new Error('Falha ao carregar funcionários');
    }
  }

  // Buscar vinculações por funcionário
  static async buscarVinculacoesPorFuncionario(funcionarioId: string, apenasAtivas: boolean = false): Promise<Vinculacao[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('funcionarioId', '==', funcionarioId),
        orderBy('dataVinculacao', 'desc')
      );

      if (apenasAtivas) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('funcionarioId', '==', funcionarioId),
          where('ativa', '==', true),
          orderBy('dataVinculacao', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataVinculacao: doc.data().dataVinculacao.toDate(),
        dataDesvinculacao: doc.data().dataDesvinculacao?.toDate() || undefined,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Vinculacao[];

    } catch (error) {
      console.error('Erro ao buscar vinculações:', error);
      throw new Error('Falha ao carregar histórico de vinculações');
    }
  }

  // Gerar relatório de equipamentos
  static async gerarRelatorioEquipamentos(): Promise<RelatorioEquipamento> {
    try {
      const [notebooks, celulares, numeros, funcionarios] = await Promise.all([
        NotebookService.buscarTodosNotebooks(),
        CelularService.buscarTodosCelulares(),
        NumeroTelefoneService.buscarTodosNumeros(),
        FuncionarioService.buscarTodosFuncionarios()
      ]);

      const relatorio: RelatorioEquipamento = {
        totalNotebooks: notebooks.length,
        notebooksDisponiveis: notebooks.filter(n => n.status === 'disponivel').length,
        notebooksEmUso: notebooks.filter(n => n.status === 'em_uso').length,
        
        totalCelulares: celulares.length,
        celularesDisponiveis: celulares.filter(c => c.status === 'disponivel').length,
        celularesEmUso: celulares.filter(c => c.status === 'em_uso').length,
        
        totalNumeros: numeros.length,
        numerosDisponiveis: numeros.filter(n => n.status === 'disponivel').length,
        numerosEmUso: numeros.filter(n => n.status === 'em_uso').length,
        
        totalFuncionarios: funcionarios.length,
        funcionariosComEquipamentos: 0 // Será calculado abaixo
      };

      // Calcular funcionários com equipamentos
      let funcionariosComEquipamentos = 0;
      for (const funcionario of funcionarios) {
        const temNotebook = notebooks.some(n => n.funcionarioId === funcionario.id);
        const temCelular = celulares.some(c => c.funcionarioId === funcionario.id);
        const temNumero = numeros.some(n => n.funcionarioId === funcionario.id);
        
        if (temNotebook || temCelular || temNumero) {
          funcionariosComEquipamentos++;
        }
      }

      relatorio.funcionariosComEquipamentos = funcionariosComEquipamentos;

      return relatorio;

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error('Falha ao gerar relatório');
    }
  }
}
