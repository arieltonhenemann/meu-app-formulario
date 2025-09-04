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
import { Celular, CelularForm, StatusEquipamento } from '../types/equipment';

const COLLECTION_NAME = 'celulares';

export class CelularService {
  // Criar celular
  static async criarCelular(dadosCelular: CelularForm): Promise<string> {
    try {
      const novoCelular = {
        marca: dadosCelular.marca,
        modelo: dadosCelular.modelo,
        numeroSerie: dadosCelular.numeroSerie || '',
        imei: dadosCelular.imei,
        status: StatusEquipamento.DISPONIVEL,
        dataCompra: new Date(dadosCelular.dataCompra),
        valorCompra: dadosCelular.valorCompra,
        observacoes: dadosCelular.observacoes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoCelular);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar celular:', error);
      throw new Error('Falha ao cadastrar celular');
    }
  }

  // Buscar todos os celulares
  static async buscarTodosCelulares(): Promise<Celular[]> {
    try {
      // Consulta simples sem índices compostos
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataCompra: doc.data().dataCompra?.toDate ? doc.data().dataCompra.toDate() : new Date(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Celular)
        .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    } catch (error) {
      console.error('Erro ao buscar celulares:', error);
      throw new Error('Falha ao carregar celulares');
    }
  }

  // Buscar celulares disponíveis
  static async buscarCelularesDisponiveis(): Promise<Celular[]> {
    try {
      // Consulta simples, filtrar e ordenar no cliente
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataCompra: doc.data().dataCompra?.toDate ? doc.data().dataCompra.toDate() : new Date(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as Celular)
        .filter(cel => cel.status === StatusEquipamento.DISPONIVEL)
        .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
    } catch (error) {
      console.error('Erro ao buscar celulares disponíveis:', error);
      throw new Error('Falha ao carregar celulares disponíveis');
    }
  }

  // Buscar celular por ID
  static async buscarCelularPorId(id: string): Promise<Celular | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataCompra: data.dataCompra.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Celular;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar celular:', error);
      throw new Error('Falha ao carregar celular');
    }
  }

  // Atualizar celular
  static async atualizarCelular(id: string, dadosAtualizados: Partial<CelularForm>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dadosParaAtualizar: any = {
        updatedAt: new Date()
      };

      if (dadosAtualizados.marca) dadosParaAtualizar.marca = dadosAtualizados.marca;
      if (dadosAtualizados.modelo) dadosParaAtualizar.modelo = dadosAtualizados.modelo;
      if (dadosAtualizados.numeroSerie !== undefined) dadosParaAtualizar.numeroSerie = dadosAtualizados.numeroSerie;
      if (dadosAtualizados.imei) dadosParaAtualizar.imei = dadosAtualizados.imei;
      if (dadosAtualizados.valorCompra) dadosParaAtualizar.valorCompra = dadosAtualizados.valorCompra;
      if (dadosAtualizados.observacoes !== undefined) dadosParaAtualizar.observacoes = dadosAtualizados.observacoes;

      if (dadosAtualizados.dataCompra) {
        dadosParaAtualizar.dataCompra = new Date(dadosAtualizados.dataCompra);
      }

      await updateDoc(docRef, dadosParaAtualizar);
    } catch (error) {
      console.error('Erro ao atualizar celular:', error);
      throw new Error('Falha ao atualizar celular');
    }
  }

  // Vincular celular a funcionário
  static async vincularCelular(celularId: string, funcionarioId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, celularId);
      await updateDoc(docRef, {
        funcionarioId: funcionarioId,
        status: StatusEquipamento.EM_USO,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao vincular celular:', error);
      throw new Error('Falha ao vincular celular');
    }
  }

  // Desvincular celular
  static async desvincularCelular(celularId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, celularId);
      await updateDoc(docRef, {
        funcionarioId: null,
        status: StatusEquipamento.DISPONIVEL,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao desvincular celular:', error);
      throw new Error('Falha ao desvincular celular');
    }
  }

  // Alterar status do celular
  static async alterarStatusCelular(celularId: string, novoStatus: StatusEquipamento): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, celularId);
      await updateDoc(docRef, {
        status: novoStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao alterar status do celular:', error);
      throw new Error('Falha ao alterar status do celular');
    }
  }

  // Buscar celulares por status
  static async buscarCelularesPorStatus(status: StatusEquipamento): Promise<Celular[]> {
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
        dataCompra: doc.data().dataCompra.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Celular[];
    } catch (error) {
      console.error('Erro ao buscar celulares por status:', error);
      throw new Error('Falha ao carregar celulares por status');
    }
  }

  // Buscar celular por funcionário
  static async buscarCelularPorFuncionario(funcionarioId: string): Promise<Celular | null> {
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
          dataCompra: data.dataCompra.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Celular;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar celular por funcionário:', error);
      throw new Error('Falha ao carregar celular do funcionário');
    }
  }

  // Buscar celular por IMEI
  static async buscarCelularPorImei(imei: string): Promise<Celular | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('imei', '==', imei)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCompra: data.dataCompra.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Celular;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar celular por IMEI:', error);
      throw new Error('Falha ao carregar celular por IMEI');
    }
  }

  // Atualizar celular completo
  static async atualizarCelularCompleto(id: string, dadosAtualizados: {
    marca: string;
    modelo: string;
    imei: string;
    numeroSerie?: string;
    valorCompra: number;
    dataCompra: string;
    observacoes: string;
  }): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        marca: dadosAtualizados.marca,
        modelo: dadosAtualizados.modelo,
        imei: dadosAtualizados.imei,
        numeroSerie: dadosAtualizados.numeroSerie || '',
        valorCompra: dadosAtualizados.valorCompra,
        dataCompra: new Date(dadosAtualizados.dataCompra),
        observacoes: dadosAtualizados.observacoes,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar celular completo:', error);
      throw new Error('Falha ao atualizar celular');
    }
  }

  // Excluir celular
  static async excluirCelular(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir celular:', error);
      throw new Error('Falha ao excluir celular');
    }
  }
}
