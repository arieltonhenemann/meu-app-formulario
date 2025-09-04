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
import { Funcionario, FuncionarioForm } from '../types/equipment';

const COLLECTION_NAME = 'funcionarios';

export class FuncionarioService {
  // Criar funcionário
  static async criarFuncionario(dadosFuncionario: FuncionarioForm): Promise<string> {
    try {
      const novoFuncionario = {
        nome: dadosFuncionario.nome,
        setor: dadosFuncionario.setor,
        ativo: dadosFuncionario.ativo,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoFuncionario);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw new Error('Falha ao cadastrar funcionário');
    }
  }

  // Buscar todos os funcionários
  static async buscarTodosFuncionarios(): Promise<Funcionario[]> {
    try {
      // Consulta simples sem índices compostos
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Funcionario)
        .filter(func => func.ativo !== false) // Filtrar no cliente
        .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordenar no cliente
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      throw new Error('Falha ao carregar funcionários');
    }
  }

  // Buscar funcionário por ID
  static async buscarFuncionarioPorId(id: string): Promise<Funcionario | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Funcionario;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      throw new Error('Falha ao carregar funcionário');
    }
  }

  // Atualizar funcionário
  static async atualizarFuncionario(id: string, dadosAtualizados: Partial<FuncionarioForm>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dadosParaAtualizar: any = {
        ...dadosAtualizados,
        updatedAt: new Date()
      };

      await updateDoc(docRef, dadosParaAtualizar);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw new Error('Falha ao atualizar funcionário');
    }
  }

  // Desativar funcionário (soft delete)
  static async desativarFuncionario(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ativo: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao desativar funcionário:', error);
      throw new Error('Falha ao desativar funcionário');
    }
  }

  // Reativar funcionário
  static async reativarFuncionario(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ativo: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao reativar funcionário:', error);
      throw new Error('Falha ao reativar funcionário');
    }
  }

  // Buscar funcionários por setor
  static async buscarFuncionariosPorSetor(setor: string): Promise<Funcionario[]> {
    try {
      // Consulta simples, filtrar no cliente
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Funcionario)
        .filter(func => func.setor === setor && func.ativo !== false)
        .sort((a, b) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar funcionários por setor:', error);
      throw new Error('Falha ao carregar funcionários do setor');
    }
  }
}
