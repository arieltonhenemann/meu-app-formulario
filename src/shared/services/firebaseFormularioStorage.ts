// Serviço híbrido: Firebase Firestore + localStorage como fallback
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { FormularioSalvo, StatusFormulario, TipoFormulario, criarFormularioSalvo } from '../types/formularioSalvo';
import { OrdemServico } from '../types/os';
import { OrdemServicoPON } from '../types/pon';
import { OrdemServicoLINK } from '../types/link';

const COLLECTION_NAME = 'formularios';
const STORAGE_KEY = 'formularios_salvos';
const SYNC_KEY = 'sync_pendente';

interface FormularioFirestore extends Omit<FormularioSalvo, 'id'> {
  // O id será gerado automaticamente pelo Firestore
}

class FirebaseFormularioStorageService {
  private isOnline = navigator.onLine;
  private listeners: ((formularios: FormularioSalvo[]) => void)[] = [];
  
  constructor() {
    // Monitorar status de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sincronizarDados();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Verificar se Firebase está configurado corretamente
  private isFirebaseConfigured(): boolean {
    try {
      return db !== null && typeof db === 'object' && isFirebaseConfigured();
    } catch (error) {
      console.warn('Firebase não está configurado corretamente:', error);
      return false;
    }
  }

  // Obter todos os formulários
  async obterTodos(): Promise<FormularioSalvo[]> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          orderBy('dataModificacao', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const formularios: FormularioSalvo[] = [];
        querySnapshot.forEach((doc) => {
          formularios.push({
            id: doc.id,
            ...doc.data()
          } as FormularioSalvo);
        });
        
        // Salvar no localStorage como cache
        this.salvarNoLocalStorage(formularios);
        
        return formularios;
      } catch (error) {
        console.error('Erro ao buscar no Firebase, usando localStorage:', error);
        return this.obterDoLocalStorage();
      }
    } else {
      return this.obterDoLocalStorage();
    }
  }

  // Salvar formulário
  async salvar<T extends OrdemServico | OrdemServicoPON | OrdemServicoLINK>(
    tipo: TipoFormulario,
    dados: T,
    criadoPor?: {
      uid: string;
      email: string;
      displayName?: string | null;
    }
  ): Promise<FormularioSalvo> {
    const formulario = criarFormularioSalvo(tipo, dados, criadoPor);
    
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const { id, ...formularioSemId } = formulario;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), formularioSemId);
        
        const formularioComId = { ...formulario, id: docRef.id };
        
        // Salvar no localStorage como cache
        this.adicionarNoLocalStorage(formularioComId);
        
        return formularioComId;
      } catch (error) {
        console.error('Erro ao salvar no Firebase, salvando offline:', error);
        this.salvarParaSincronizar(formulario);
        return this.salvarNoLocalStorageERetornar(formulario);
      }
    } else {
      this.salvarParaSincronizar(formulario);
      return this.salvarNoLocalStorageERetornar(formulario);
    }
  }

  // Atualizar formulário existente
  async atualizar(id: string, novosDados: any): Promise<boolean> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          dados: novosDados,
          codigoOS: novosDados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
          dataModificacao: new Date().toISOString()
        });
        
        // Atualizar no localStorage também
        this.atualizarNoLocalStorage(id, novosDados);
        
        return true;
      } catch (error) {
        console.error('Erro ao atualizar no Firebase, salvando offline:', error);
        this.salvarAtualizacaoParaSincronizar(id, novosDados);
        return this.atualizarNoLocalStorage(id, novosDados);
      }
    } else {
      this.salvarAtualizacaoParaSincronizar(id, novosDados);
      return this.atualizarNoLocalStorage(id, novosDados);
    }
  }

  // Atualizar status do formulário
  async atualizarStatus(id: string, novoStatus: StatusFormulario): Promise<boolean> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          status: novoStatus,
          dataModificacao: new Date().toISOString()
        });
        
        // Atualizar no localStorage também
        this.atualizarStatusNoLocalStorage(id, novoStatus);
        
        return true;
      } catch (error) {
        console.error('Erro ao atualizar status no Firebase, salvando offline:', error);
        this.salvarAtualizacaoStatusParaSincronizar(id, novoStatus);
        return this.atualizarStatusNoLocalStorage(id, novoStatus);
      }
    } else {
      this.salvarAtualizacaoStatusParaSincronizar(id, novoStatus);
      return this.atualizarStatusNoLocalStorage(id, novoStatus);
    }
  }

  // Excluir formulário
  async excluir(id: string): Promise<boolean> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        
        // Remover do localStorage também
        this.excluirDoLocalStorage(id);
        
        return true;
      } catch (error) {
        console.error('Erro ao excluir no Firebase, marcando para exclusão:', error);
        this.salvarExclusaoParaSincronizar(id);
        return this.excluirDoLocalStorage(id);
      }
    } else {
      this.salvarExclusaoParaSincronizar(id);
      return this.excluirDoLocalStorage(id);
    }
  }

  // Obter formulário por ID
  async obterPorId(id: string): Promise<FormularioSalvo | null> {
    const formularios = await this.obterTodos();
    return formularios.find(f => f.id === id) || null;
  }

  // Filtrar por status
  async filtrarPorStatus(status: StatusFormulario): Promise<FormularioSalvo[]> {
    const formularios = await this.obterTodos();
    return formularios.filter(f => f.status === status);
  }

  // Filtrar por tipo
  async filtrarPorTipo(tipo: TipoFormulario): Promise<FormularioSalvo[]> {
    const formularios = await this.obterTodos();
    return formularios.filter(f => f.tipo === tipo);
  }

  // Obter estatísticas
  async obterEstatisticas() {
    const formularios = await this.obterTodos();
    
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

  // Sincronizar dados offline com Firebase
  async sincronizarDados(): Promise<void> {
    if (!this.isOnline || !this.isFirebaseConfigured()) return;

    try {
      const dadosPendentes = this.obterDadosPendentesParaSincronizar();
      
      for (const operacao of dadosPendentes) {
        switch (operacao.tipo) {
          case 'criar':
            await addDoc(collection(db, COLLECTION_NAME), operacao.dados);
            break;
          case 'atualizar':
            await updateDoc(doc(db, COLLECTION_NAME, operacao.id), operacao.dados);
            break;
          case 'excluir':
            await deleteDoc(doc(db, COLLECTION_NAME, operacao.id));
            break;
        }
      }
      
      // Limpar dados pendentes após sincronização
      localStorage.removeItem(SYNC_KEY);
      
      console.log('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  // Escutar mudanças em tempo real (opcional)
  escutarMudancas(callback: (formularios: FormularioSalvo[]) => void): () => void {
    this.listeners.push(callback);
    
    if (!this.isOnline || !this.isFirebaseConfigured()) {
      // Se offline, usar dados do localStorage
      const formularios = this.obterDoLocalStorage();
      callback(formularios);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('dataModificacao', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const formularios: FormularioSalvo[] = [];
      querySnapshot.forEach((doc) => {
        formularios.push({
          id: doc.id,
          ...doc.data()
        } as FormularioSalvo);
      });
      
      // Salvar no localStorage como cache
      this.salvarNoLocalStorage(formularios);
      
      callback(formularios);
    }, (error) => {
      console.error('Erro ao escutar mudanças, usando cache local:', error);
      const formularios = this.obterDoLocalStorage();
      callback(formularios);
    });

    return unsubscribe;
  }

  // Status da conexão
  estaOnline(): boolean {
    return this.isOnline && this.isFirebaseConfigured();
  }

  // === MÉTODOS PRIVADOS PARA LOCALSTORAGE ===

  private obterDoLocalStorage(): FormularioSalvo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return [];
    }
  }

  private salvarNoLocalStorage(formularios: FormularioSalvo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formularios));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  private adicionarNoLocalStorage(formulario: FormularioSalvo): void {
    const formularios = this.obterDoLocalStorage();
    formularios.unshift(formulario); // Adicionar no início
    this.salvarNoLocalStorage(formularios);
  }

  private salvarNoLocalStorageERetornar(formulario: FormularioSalvo): FormularioSalvo {
    this.adicionarNoLocalStorage(formulario);
    return formulario;
  }

  private atualizarNoLocalStorage(id: string, novosDados: any): boolean {
    const formularios = this.obterDoLocalStorage();
    const index = formularios.findIndex(f => f.id === id);
    
    if (index === -1) return false;
    
    formularios[index] = {
      ...formularios[index],
      dados: novosDados,
      codigoOS: novosDados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
      dataModificacao: new Date().toISOString()
    };
    
    this.salvarNoLocalStorage(formularios);
    return true;
  }

  private atualizarStatusNoLocalStorage(id: string, novoStatus: StatusFormulario): boolean {
    const formularios = this.obterDoLocalStorage();
    const index = formularios.findIndex(f => f.id === id);
    
    if (index === -1) return false;
    
    formularios[index] = {
      ...formularios[index],
      status: novoStatus,
      dataModificacao: new Date().toISOString()
    };
    
    this.salvarNoLocalStorage(formularios);
    return true;
  }

  private excluirDoLocalStorage(id: string): boolean {
    const formularios = this.obterDoLocalStorage();
    const formulariosAtualizados = formularios.filter(f => f.id !== id);
    
    if (formulariosAtualizados.length === formularios.length) {
      return false;
    }
    
    this.salvarNoLocalStorage(formulariosAtualizados);
    return true;
  }

  // === MÉTODOS PARA SINCRONIZAÇÃO ===

  private salvarParaSincronizar(formulario: FormularioSalvo): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: 'criar',
      dados: formulario,
      timestamp: Date.now()
    });
    localStorage.setItem(SYNC_KEY, JSON.stringify(pendentes));
  }

  private salvarAtualizacaoParaSincronizar(id: string, dados: any): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: 'atualizar',
      id,
      dados: { 
        dados, 
        codigoOS: dados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
        dataModificacao: new Date().toISOString() 
      },
      timestamp: Date.now()
    });
    localStorage.setItem(SYNC_KEY, JSON.stringify(pendentes));
  }

  private salvarAtualizacaoStatusParaSincronizar(id: string, status: StatusFormulario): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: 'atualizar',
      id,
      dados: { status, dataModificacao: new Date().toISOString() },
      timestamp: Date.now()
    });
    localStorage.setItem(SYNC_KEY, JSON.stringify(pendentes));
  }

  private salvarExclusaoParaSincronizar(id: string): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: 'excluir',
      id,
      timestamp: Date.now()
    });
    localStorage.setItem(SYNC_KEY, JSON.stringify(pendentes));
  }

  private obterDadosPendentesParaSincronizar(): any[] {
    try {
      const data = localStorage.getItem(SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao obter dados pendentes:', error);
      return [];
    }
  }

  // Verificar se há dados pendentes para sincronizar
  temDadosPendentes(): boolean {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    return pendentes.length > 0;
  }

  // Limpar todos os dados (usar com cuidado)
  async limparTodos(): Promise<void> {
    // Limpar localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_KEY);
    
    // Limpar Firebase se possível
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Erro ao limpar Firebase:', error);
      }
    }
  }
}

// Exportar instância única do serviço
export const firebaseFormularioStorage = new FirebaseFormularioStorageService();
