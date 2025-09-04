import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NumeroTelefone, NumeroTelefoneForm, StatusEquipamento } from '../types/equipment';

const COLLECTION_NAME = 'numerostelefone';

export class NumeroTelefoneService {
  // Criar número de telefone
  static async criarNumeroTelefone(dadosNumero: NumeroTelefoneForm): Promise<string> {
    try {
      const novoNumero = {
        numero: dadosNumero.numero,
        operadora: dadosNumero.operadora,
        plano: dadosNumero.plano,
        valorMensal: dadosNumero.valorMensal,
        status: StatusEquipamento.DISPONIVEL,
        dataAtivacao: new Date(dadosNumero.dataAtivacao),
        observacoes: dadosNumero.observacoes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoNumero);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar número de telefone:', error);
      throw new Error('Falha ao cadastrar número de telefone');
    }
  }

  // Buscar todos os números
  static async buscarTodosNumeros(): Promise<NumeroTelefone[]> {
    try {
      // Consulta simples sem índices compostos
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataAtivacao: doc.data().dataAtivacao?.toDate ? doc.data().dataAtivacao.toDate() : new Date(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as NumeroTelefone)
        .sort((a, b) => a.operadora.localeCompare(b.operadora) || a.numero.localeCompare(b.numero));
    } catch (error) {
      console.error('Erro ao buscar números de telefone:', error);
      throw new Error('Falha ao carregar números de telefone');
    }
  }

  // Buscar números disponíveis
  static async buscarNumerosDisponiveis(): Promise<NumeroTelefone[]> {
    try {
      // Consulta simples, filtrar e ordenar no cliente
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dataAtivacao: doc.data().dataAtivacao?.toDate ? doc.data().dataAtivacao.toDate() : new Date(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
        }) as NumeroTelefone)
        .filter(num => num.status === StatusEquipamento.DISPONIVEL)
        .sort((a, b) => a.operadora.localeCompare(b.operadora) || a.numero.localeCompare(b.numero));
    } catch (error) {
      console.error('Erro ao buscar números disponíveis:', error);
      throw new Error('Falha ao carregar números disponíveis');
    }
  }

  // Buscar número por ID
  static async buscarNumeroPorId(id: string): Promise<NumeroTelefone | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataAtivacao: data.dataAtivacao.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as NumeroTelefone;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar número de telefone:', error);
      throw new Error('Falha ao carregar número de telefone');
    }
  }

  // Atualizar número
  static async atualizarNumero(id: string, dadosAtualizados: Partial<NumeroTelefoneForm>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dadosParaAtualizar: any = {
        updatedAt: new Date()
      };

      if (dadosAtualizados.numero) dadosParaAtualizar.numero = dadosAtualizados.numero;
      if (dadosAtualizados.operadora) dadosParaAtualizar.operadora = dadosAtualizados.operadora;
      if (dadosAtualizados.plano) dadosParaAtualizar.plano = dadosAtualizados.plano;
      if (dadosAtualizados.valorMensal) dadosParaAtualizar.valorMensal = dadosAtualizados.valorMensal;
      if (dadosAtualizados.observacoes !== undefined) dadosParaAtualizar.observacoes = dadosAtualizados.observacoes;

      if (dadosAtualizados.dataAtivacao) {
        dadosParaAtualizar.dataAtivacao = new Date(dadosAtualizados.dataAtivacao);
      }

      await updateDoc(docRef, dadosParaAtualizar);
    } catch (error) {
      console.error('Erro ao atualizar número de telefone:', error);
      throw new Error('Falha ao atualizar número de telefone');
    }
  }

  // Vincular número a funcionário
  static async vincularNumero(numeroId: string, funcionarioId: string, celularId?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, numeroId);
      const dadosVinculacao: any = {
        funcionarioId: funcionarioId,
        status: StatusEquipamento.EM_USO,
        updatedAt: new Date()
      };

      if (celularId) {
        dadosVinculacao.celularId = celularId;
      }

      await updateDoc(docRef, dadosVinculacao);
    } catch (error) {
      console.error('Erro ao vincular número:', error);
      throw new Error('Falha ao vincular número');
    }
  }

  // Desvincular número
  static async desvincularNumero(numeroId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, numeroId);
      await updateDoc(docRef, {
        funcionarioId: null,
        celularId: null,
        status: StatusEquipamento.DISPONIVEL,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao desvincular número:', error);
      throw new Error('Falha ao desvincular número');
    }
  }

  // Alterar status do número
  static async alterarStatusNumero(numeroId: string, novoStatus: StatusEquipamento): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, numeroId);
      await updateDoc(docRef, {
        status: novoStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao alterar status do número:', error);
      throw new Error('Falha ao alterar status do número');
    }
  }

  // Buscar números por status
  static async buscarNumerosPorStatus(status: StatusEquipamento): Promise<NumeroTelefone[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('operadora'),
        orderBy('numero')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataAtivacao: doc.data().dataAtivacao.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as NumeroTelefone[];
    } catch (error) {
      console.error('Erro ao buscar números por status:', error);
      throw new Error('Falha ao carregar números por status');
    }
  }

  // Buscar número por funcionário
  static async buscarNumeroPorFuncionario(funcionarioId: string): Promise<NumeroTelefone | null> {
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
          dataAtivacao: data.dataAtivacao.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as NumeroTelefone;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar número por funcionário:', error);
      throw new Error('Falha ao carregar número do funcionário');
    }
  }

  // Buscar número por celular
  static async buscarNumeroPorCelular(celularId: string): Promise<NumeroTelefone | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('celularId', '==', celularId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataAtivacao: data.dataAtivacao.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as NumeroTelefone;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar número por celular:', error);
      throw new Error('Falha ao carregar número do celular');
    }
  }

  // Buscar números por operadora
  static async buscarNumerosPorOperadora(operadora: string): Promise<NumeroTelefone[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('operadora', '==', operadora),
        orderBy('numero')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataAtivacao: doc.data().dataAtivacao.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as NumeroTelefone[];
    } catch (error) {
      console.error('Erro ao buscar números por operadora:', error);
      throw new Error('Falha ao carregar números da operadora');
    }
  }

  // Buscar número por número de telefone
  static async buscarPorNumero(numeroTelefone: string): Promise<NumeroTelefone | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('numero', '==', numeroTelefone)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataAtivacao: data.dataAtivacao.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as NumeroTelefone;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar por número:', error);
      throw new Error('Falha ao buscar número');
    }
  }
}
