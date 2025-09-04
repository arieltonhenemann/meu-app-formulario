import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notebook, NotebookForm, StatusEquipamento } from '../types/equipment';

const COLLECTION_NAME = 'notebooks';

export class NotebookService {
  // Criar notebook
  static async criarNotebook(dadosNotebook: NotebookForm): Promise<string> {
    try {
      const novoNotebook = {
        marca: dadosNotebook.marca,
        modelo: dadosNotebook.modelo,
        numeroSerie: dadosNotebook.numeroSerie,
        configuracao: {
          processador: dadosNotebook.processador,
          memoria: dadosNotebook.memoria,
          armazenamento: dadosNotebook.armazenamento,
          sistemaOperacional: dadosNotebook.sistemaOperacional
        },
        status: StatusEquipamento.DISPONIVEL,
        dataCompra: dadosNotebook.dataCompra ? new Date(dadosNotebook.dataCompra) : null,
        valorCompra: dadosNotebook.valorCompra,
        observacoes: dadosNotebook.observacoes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoNotebook);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar notebook:', error);
      throw new Error('Falha ao cadastrar notebook');
    }
  }

  // Buscar todos os notebooks
  static async buscarTodosNotebooks(): Promise<Notebook[]> {
    try {
      // Consulta simples sem índices compostos
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataCompra: doc.data().dataCompra?.toDate ? doc.data().dataCompra.toDate() : null,
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Notebook)
        .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    } catch (error) {
      console.error('Erro ao buscar notebooks:', error);
      throw new Error('Falha ao carregar notebooks');
    }
  }

  // Buscar notebooks disponíveis
  static async buscarNotebooksDisponiveis(): Promise<Notebook[]> {
    try {
      // Consulta simples, filtrar e ordenar no cliente
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataCompra: doc.data().dataCompra?.toDate ? doc.data().dataCompra.toDate() : null,
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Notebook)
        .filter(nb => nb.status === StatusEquipamento.DISPONIVEL)
        .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    } catch (error) {
      console.error('Erro ao buscar notebooks disponíveis:', error);
      throw new Error('Falha ao carregar notebooks disponíveis');
    }
  }

  // Buscar notebook por ID
  static async buscarNotebookPorId(id: string): Promise<Notebook | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataCompra: data.dataCompra ? data.dataCompra.toDate() : null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Notebook;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar notebook:', error);
      throw new Error('Falha ao carregar notebook');
    }
  }

  // Atualizar notebook
  static async atualizarNotebook(id: string, dadosAtualizados: Partial<NotebookForm>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dadosParaAtualizar: any = {
        updatedAt: new Date()
      };

      if (dadosAtualizados.marca) dadosParaAtualizar.marca = dadosAtualizados.marca;
      if (dadosAtualizados.modelo) dadosParaAtualizar.modelo = dadosAtualizados.modelo;
      if (dadosAtualizados.numeroSerie) dadosParaAtualizar.numeroSerie = dadosAtualizados.numeroSerie;
      if (dadosAtualizados.valorCompra) dadosParaAtualizar.valorCompra = dadosAtualizados.valorCompra;
      if (dadosAtualizados.observacoes !== undefined) dadosParaAtualizar.observacoes = dadosAtualizados.observacoes;

      if (dadosAtualizados.dataCompra) {
        dadosParaAtualizar.dataCompra = new Date(dadosAtualizados.dataCompra);
      }

      if (dadosAtualizados.processador || dadosAtualizados.memoria || 
          dadosAtualizados.armazenamento || dadosAtualizados.sistemaOperacional) {
        // Primeiro buscar a configuração atual
        const notebookAtual = await this.buscarNotebookPorId(id);
        if (notebookAtual) {
          dadosParaAtualizar.configuracao = {
            processador: dadosAtualizados.processador || notebookAtual.configuracao.processador,
            memoria: dadosAtualizados.memoria || notebookAtual.configuracao.memoria,
            armazenamento: dadosAtualizados.armazenamento || notebookAtual.configuracao.armazenamento,
            sistemaOperacional: dadosAtualizados.sistemaOperacional || notebookAtual.configuracao.sistemaOperacional
          };
        }
      }

      await updateDoc(docRef, dadosParaAtualizar);
    } catch (error) {
      console.error('Erro ao atualizar notebook:', error);
      throw new Error('Falha ao atualizar notebook');
    }
  }

  // Vincular notebook a funcionário
  static async vincularNotebook(notebookId: string, funcionarioId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, notebookId);
      await updateDoc(docRef, {
        funcionarioId: funcionarioId,
        status: StatusEquipamento.EM_USO,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao vincular notebook:', error);
      throw new Error('Falha ao vincular notebook');
    }
  }

  // Desvincular notebook
  static async desvincularNotebook(notebookId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, notebookId);
      await updateDoc(docRef, {
        funcionarioId: null,
        status: StatusEquipamento.DISPONIVEL,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao desvincular notebook:', error);
      throw new Error('Falha ao desvincular notebook');
    }
  }

  // Alterar status do notebook
  static async alterarStatusNotebook(notebookId: string, novoStatus: StatusEquipamento): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, notebookId);
      await updateDoc(docRef, {
        status: novoStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao alterar status do notebook:', error);
      throw new Error('Falha ao alterar status do notebook');
    }
  }

  // Buscar notebooks por status
  static async buscarNotebooksPorStatus(status: StatusEquipamento): Promise<Notebook[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('marca'),
        orderBy('modelo')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataCompra: doc.data().dataCompra ? doc.data().dataCompra.toDate() : null,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Notebook[];
    } catch (error) {
      console.error('Erro ao buscar notebooks por status:', error);
      throw new Error('Falha ao carregar notebooks por status');
    }
  }

  // Buscar notebook por funcionário
  static async buscarNotebookPorFuncionario(funcionarioId: string): Promise<Notebook | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('funcionarioId', '==', funcionarioId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCompra: data.dataCompra ? data.dataCompra.toDate() : null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Notebook;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar notebook por funcionário:', error);
      throw new Error('Falha ao carregar notebook do funcionário');
    }
  }

  // Excluir notebook
  static async excluirNotebook(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir notebook:', error);
      throw new Error('Falha ao excluir notebook');
    }
  }

  // Atualizar notebook completo
  static async atualizarNotebookCompleto(id: string, dadosAtualizados: {
    marca: string;
    modelo: string;
    numeroSerie: string;
    processador: string;
    memoria: string;
    armazenamento: string;
    sistemaOperacional: string;
    valorCompra: number;
    dataCompra: string;
    observacoes: string;
  }): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dadosParaAtualizar = {
        marca: dadosAtualizados.marca,
        modelo: dadosAtualizados.modelo,
        numeroSerie: dadosAtualizados.numeroSerie,
        configuracao: {
          processador: dadosAtualizados.processador,
          memoria: dadosAtualizados.memoria,
          armazenamento: dadosAtualizados.armazenamento,
          sistemaOperacional: dadosAtualizados.sistemaOperacional
        },
        valorCompra: dadosAtualizados.valorCompra,
        dataCompra: dadosAtualizados.dataCompra ? new Date(dadosAtualizados.dataCompra) : null,
        observacoes: dadosAtualizados.observacoes,
        updatedAt: new Date()
      };

      await updateDoc(docRef, dadosParaAtualizar);
    } catch (error) {
      console.error('Erro ao atualizar notebook:', error);
      throw new Error('Falha ao atualizar notebook');
    }
  }
}
