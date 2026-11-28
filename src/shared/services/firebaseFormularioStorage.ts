// Serviço híbrido: Firebase Firestore + localStorage como fallback
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "../config/firebase";
import {
  FormularioSalvo,
  FormularioSalvoBase,
  StatusFormulario,
  TipoFormulario,
  criarFormularioSalvo,
} from "../types/formularioSalvo";
import { OrdemServico } from "../types/os";
import { OrdemServicoPON } from "../types/pon";
import { OrdemServicoLINK } from "../types/link";
import { OrdemServicoAdequacao } from "../types/adequacao";
import { logger } from "../utils/logger";

const COLLECTION_NAME = "formularios";
// Chaves por usuário: evita que o cache de um admin (que vê todas as O.S.)
// seja lido por outro usuário no mesmo navegador.
const STORAGE_KEY_BASE = "meuapp_v1_formularios";
const SYNC_KEY_BASE = "meuapp_v1_sync";
const LEGACY_STORAGE_KEY = "meuapp_v1_formularios_salvos";

/** União de todos os tipos de dados de formulário suportados. */
type DadosFormulario = OrdemServico | OrdemServicoPON | OrdemServicoLINK | OrdemServicoAdequacao;

/** Operações offline pendentes de sincronização com o Firestore. */
type OperacaoPendente =
  | { tipo: 'criar'; dados: FormularioSalvo; timestamp: number }
  | { tipo: 'atualizar'; id: string; dados: Partial<FormularioSalvoBase> & { dados?: DadosFormulario }; timestamp: number }
  | { tipo: 'excluir'; id: string; timestamp: number };

class FirebaseFormularioStorageService {
  private isOnline = navigator.onLine;
  private listeners: ((formularios: FormularioSalvo[]) => void)[] = [];

  constructor() {
    // Monitorar status de conexão
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.sincronizarDados();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  // Verificar se Firebase está configurado corretamente
  private isFirebaseConfigured(): boolean {
    try {
      return db !== null && typeof db === "object" && isFirebaseConfigured();
    } catch (error) {
      logger.warn("Firebase não está configurado corretamente:", error);
      return false;
    }
  }

  private uidAtual(): string {
    return auth?.currentUser?.uid || "anonimo";
  }

  private chaveStorage(uid?: string | null): string {
    return uid ? `${STORAGE_KEY_BASE}_${uid}` : `${STORAGE_KEY_BASE}_${this.uidAtual()}`;
  }

  private chaveSync(uid?: string | null): string {
    return uid ? `${SYNC_KEY_BASE}_${uid}` : `${SYNC_KEY_BASE}_${this.uidAtual()}`;
  }

  /** Aceita apenas UIDs plausíveis do Firebase, evitando filtros arbitrários. */
  private normalizarUidFilter(uidFilter?: string): string | undefined {
    if (typeof uidFilter !== "string") return undefined;
    const uid = uidFilter.trim();
    if (!uid || uid.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(uid)) return undefined;
    return uid;
  }

  /** Cache local guarda só o UID do criador — e-mail/nome ficam só no Firestore. */
  private prepararParaCache(formularios: FormularioSalvo[]): FormularioSalvo[] {
    return formularios.map((formulario) => ({
      ...formulario,
      criadoPor: formulario.criadoPor
        ? {
            uid: formulario.criadoPor.uid,
            email: "",
            displayName: formulario.criadoPor.displayName,
          }
        : undefined,
    })) as FormularioSalvo[];
  }

  /** Restaura o e-mail mínimo exigido pelas regras ao sincronizar um create offline. */
  private reidratarCriadoPor(formulario: FormularioSalvo): FormularioSalvo {
    if (!formulario.criadoPor?.uid) return formulario;
    return {
      ...formulario,
      criadoPor: {
        ...formulario.criadoPor,
        email: formulario.criadoPor.email || auth?.currentUser?.email || "",
      },
    } as FormularioSalvo;
  }

  // Obter todos os formulários
  async obterTodos(uidFilter?: string): Promise<FormularioSalvo[]> {
    const uid = this.normalizarUidFilter(uidFilter);

    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const constraints: any[] = [orderBy("dataModificacao", "desc")];
        if (uid) {
          constraints.unshift(where("criadoPor.uid", "==", uid));
        }
        const q = query(collection(db, COLLECTION_NAME), ...constraints);
        const querySnapshot = await getDocs(q);

        const formularios: FormularioSalvo[] = [];
        querySnapshot.forEach((doc) => {
          formularios.push({
            id: doc.id,
            ...doc.data(),
          } as FormularioSalvo);
        });

        // Salvar no localStorage como cache
        this.salvarNoLocalStorage(formularios);

        return formularios;
      } catch (error) {
        logger.error(
          "Erro ao buscar no Firebase, usando localStorage:",
          error
        );
        return this.obterDoLocalStorage(uid);
      }
    } else {
      return this.obterDoLocalStorage(uid);
    }
  }

  // Salvar formulário
  async salvar<
    T extends
      | OrdemServico
      | OrdemServicoPON
      | OrdemServicoLINK
      | OrdemServicoAdequacao
  >(
    tipo: TipoFormulario,
    dados: T,
    criadoPor?: {
      uid: string;
      email: string;
      displayName?: string | null;
    },
    status: StatusFormulario = "pendente"
  ): Promise<FormularioSalvo> {
    const formulario = criarFormularioSalvo(tipo, dados, criadoPor, status);

    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const { id, ...formularioSemId } = formulario;
        const docRef = await addDoc(
          collection(db, COLLECTION_NAME),
          formularioSemId
        );

        const formularioComId = { ...formulario, id: docRef.id };

        // Salvar no localStorage como cache
        this.adicionarNoLocalStorage(formularioComId);

        return formularioComId;
      } catch (error) {
        logger.error("Erro ao salvar no Firebase, salvando offline:", error);
        this.salvarParaSincronizar(formulario);
        return this.salvarNoLocalStorageERetornar(formulario);
      }
    } else {
      this.salvarParaSincronizar(formulario);
      return this.salvarNoLocalStorageERetornar(formulario);
    }
  }

  // Atualizar formulário existente
  async atualizar(id: string, novosDados: DadosFormulario): Promise<boolean> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          dados: novosDados,
          codigoOS: novosDados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
          dataModificacao: new Date().toISOString(),
        });

        // Atualizar no localStorage também
        this.atualizarNoLocalStorage(id, novosDados);

        return true;
      } catch (error) {
        logger.error(
          "Erro ao atualizar no Firebase, salvando offline:",
          error
        );
        this.salvarAtualizacaoParaSincronizar(id, novosDados);
        return this.atualizarNoLocalStorage(id, novosDados);
      }
    } else {
      this.salvarAtualizacaoParaSincronizar(id, novosDados);
      return this.atualizarNoLocalStorage(id, novosDados);
    }
  }

  // Atualizar status do formulário
  async atualizarStatus(
    id: string,
    novoStatus: StatusFormulario
  ): Promise<boolean> {
    const agora = new Date().toISOString();

    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          status: novoStatus,
          dataModificacao: agora,
          dataAlteracaoStatus: agora,
        });

        // Atualizar no localStorage também
        this.atualizarStatusNoLocalStorage(id, novoStatus, agora);

        return true;
      } catch (error) {
        logger.error(
          "Erro ao atualizar status no Firebase, salvando offline:",
          error
        );
        this.salvarAtualizacaoStatusParaSincronizar(id, novoStatus, agora);
        return this.atualizarStatusNoLocalStorage(id, novoStatus, agora);
      }
    } else {
      this.salvarAtualizacaoStatusParaSincronizar(id, novoStatus, agora);
      return this.atualizarStatusNoLocalStorage(id, novoStatus, agora);
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
        logger.error(
          "Erro ao excluir no Firebase, marcando para exclusão:",
          error
        );
        this.salvarExclusaoParaSincronizar(id);
        return this.excluirDoLocalStorage(id);
      }
    } else {
      this.salvarExclusaoParaSincronizar(id);
      return this.excluirDoLocalStorage(id);
    }
  }

  // Obter formulário por ID — usa getDoc (leitura direta) para evitar
  // query sem filtro de UID que seria rejeitada pelas Firestore Rules.
  async obterPorId(id: string): Promise<FormularioSalvo | null> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as FormularioSalvo;
        }
        return null;
      } catch (error) {
        logger.error("Erro ao buscar formulário por ID no Firebase, usando localStorage:", error);
        const formularios = this.obterDoLocalStorage();
        return formularios.find((f) => f.id === id) || null;
      }
    } else {
      const formularios = this.obterDoLocalStorage();
      return formularios.find((f) => f.id === id) || null;
    }
  }

  // Filtrar por status — aceita uidFilter para respeitar as Firestore Rules
  async filtrarPorStatus(status: StatusFormulario, uidFilter?: string): Promise<FormularioSalvo[]> {
    const formularios = await this.obterTodos(uidFilter);
    return formularios.filter((f) => f.status === status);
  }

  // Filtrar por tipo — aceita uidFilter para respeitar as Firestore Rules
  async filtrarPorTipo(tipo: TipoFormulario, uidFilter?: string): Promise<FormularioSalvo[]> {
    const formularios = await this.obterTodos(uidFilter);
    return formularios.filter((f) => f.tipo === tipo);
  }

  // Obter estatísticas — aceita uidFilter para respeitar as Firestore Rules
  async obterEstatisticas(uidFilter?: string) {
    const formularios = await this.obterTodos(uidFilter);

    return {
      total: formularios.length,
      pendentes: formularios.filter((f) => f.status === "pendente").length,
      finalizados: formularios.filter((f) => f.status === "finalizado").length,
      aguardando: formularios.filter((f) => f.status === "aguardando").length,
      agendamento: formularios.filter((f) => f.status === "agendamento").length,
      porTipo: {
        CTO: formularios.filter((f) => f.tipo === "CTO").length,
        PON: formularios.filter((f) => f.tipo === "PON").length,
        LINK: formularios.filter((f) => f.tipo === "LINK").length,
        ADEQUACAO: formularios.filter((f) => f.tipo === "ADEQUACAO").length,
      },
    };
  }

  // Sincronizar dados offline com Firebase
  async sincronizarDados(): Promise<void> {
    if (!this.isOnline || !this.isFirebaseConfigured()) return;

    try {
      const dadosPendentes = this.obterDadosPendentesParaSincronizar();

      for (const operacao of dadosPendentes) {
        switch (operacao.tipo) {
          case "criar":
            await addDoc(
              collection(db, COLLECTION_NAME),
              this.reidratarCriadoPor(operacao.dados)
            );
            break;
          case "atualizar":
            await updateDoc(
              doc(db, COLLECTION_NAME, operacao.id),
              operacao.dados
            );
            break;
          case "excluir":
            await deleteDoc(doc(db, COLLECTION_NAME, operacao.id));
            break;
        }
      }

      // Limpar dados pendentes após sincronização
      localStorage.removeItem(this.chaveSync());

      logger.log("Sincronização concluída com sucesso!");
    } catch (error) {
      logger.error("Erro na sincronização:", error);
    }
  }

  // Escutar mudanças em tempo real
  escutarMudancas(
    callback: (formularios: FormularioSalvo[]) => void,
    uidFilter?: string
  ): () => void {
    const uid = this.normalizarUidFilter(uidFilter);
    this.listeners.push(callback);

    const removerListener = () => {
      const index = this.listeners.indexOf(callback);
      if (index >= 0) this.listeners.splice(index, 1);
    };

    if (!this.isOnline || !this.isFirebaseConfigured()) {
      const formularios = this.obterDoLocalStorage(uid);
      callback(formularios);
      return removerListener;
    }

    logger.log(
      "🔄 [Firestore] Escutando mudanças em tempo real:",
      uid ? `usuário ${uid}` : "todos os usuários"
    );

    const constraints: any[] = [orderBy("dataModificacao", "desc")];
    if (uid) {
      constraints.unshift(where("criadoPor.uid", "==", uid));
    }
    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    let unsubscribesPorDoc: Array<() => void> = [];

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const formularios: FormularioSalvo[] = [];
        querySnapshot.forEach((documento) => {
          formularios.push({
            id: documento.id,
            ...documento.data(),
          } as FormularioSalvo);
        });

        logger.log("📥 [Firestore] Lista atualizada:", formularios.length, "O.S.");
        this.salvarNoLocalStorage(formularios);
        callback(formularios);
      },
      (error) => {
        logger.error("Erro ao escutar a lista no Firestore, usando cache local:", error);
        const formularios = this.obterDoLocalStorage(uid);
        callback(formularios);

        // Fallback: escuta cada O.S. do cache diretamente pelo ID, sem depender
        // da consulta com filtro/ordenação (que pode ser negada pelas regras).
        unsubscribesPorDoc = formularios.map(formulario =>
          onSnapshot(doc(db, COLLECTION_NAME, formulario.id), (docSnap) => {
            if (!docSnap.exists()) return;
            const atualizado = { id: docSnap.id, ...docSnap.data() } as FormularioSalvo;
            const listaAtual = this.obterDoLocalStorage(uid).map(f =>
              f.id === atualizado.id ? atualizado : f
            );
            this.salvarNoLocalStorage(listaAtual);
            callback(listaAtual);
          })
        );
      }
    );

    return () => {
      unsubscribe();
      unsubscribesPorDoc.forEach(parar => parar());
      removerListener();
    };
  }

  // Status da conexão
  estaOnline(): boolean {
    return this.isOnline && this.isFirebaseConfigured();
  }

  // === MÉTODOS PRIVADOS PARA LOCALSTORAGE ===

  private obterDoLocalStorage(uidFilter?: string): FormularioSalvo[] {
    try {
      let data = localStorage.getItem(this.chaveStorage(uidFilter));
      if (!data && !uidFilter) {
        // Migração única do formato antigo (sem separação por usuário).
        data = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (data) {
          const migrados = this.prepararParaCache(JSON.parse(decodeURIComponent(atob(data))) as FormularioSalvo[]);
          this.salvarNoLocalStorage(migrados);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          data = localStorage.getItem(this.chaveStorage());
        }
      }
      if (!data) return [];
      
      let dataStr;
      try {
        dataStr = decodeURIComponent(atob(data));
      } catch {
        dataStr = data; // Fallback para versão sem codificação
      }
      
      const formularios: FormularioSalvo[] = JSON.parse(dataStr);
      if (uidFilter) {
        return formularios.filter((f) => f.criadoPor?.uid === uidFilter);
      }
      return formularios;
    } catch (error) {
      logger.error("Erro ao carregar do localStorage:", error);
      return [];
    }
  }

  private salvarNoLocalStorage(formularios: FormularioSalvo[]): void {
    try {
      const dataStr = JSON.stringify(this.prepararParaCache(formularios));
      const encoded = btoa(encodeURIComponent(dataStr));
      localStorage.setItem(this.chaveStorage(), encoded);
    } catch (error) {
      logger.error("Erro ao salvar no localStorage:", error);
    }
  }

  private adicionarNoLocalStorage(formulario: FormularioSalvo): void {
    const formularios = this.obterDoLocalStorage();
    formularios.unshift(formulario); // Adicionar no início
    this.salvarNoLocalStorage(formularios);
  }

  private salvarNoLocalStorageERetornar(
    formulario: FormularioSalvo
  ): FormularioSalvo {
    this.adicionarNoLocalStorage(formulario);
    return formulario;
  }

  private atualizarNoLocalStorage(id: string, novosDados: DadosFormulario): boolean {
    const formularios = this.obterDoLocalStorage();
    const index = formularios.findIndex((f) => f.id === id);

    if (index === -1) return false;

    // O cast é seguro pois o campo `tipo` original é preservado no spread,
    // mantendo o discriminante correto da união FormularioSalvo.
    formularios[index] = {
      ...formularios[index],
      dados: novosDados,
      codigoOS: novosDados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
      dataModificacao: new Date().toISOString(),
    } as FormularioSalvo;

    this.salvarNoLocalStorage(formularios);
    return true;
  }

  private atualizarStatusNoLocalStorage(
    id: string,
    novoStatus: StatusFormulario,
    dataAlteracaoStatus: string = new Date().toISOString()
  ): boolean {
    const formularios = this.obterDoLocalStorage();
    const index = formularios.findIndex((f) => f.id === id);

    if (index === -1) return false;

    formularios[index] = {
      ...formularios[index],
      status: novoStatus,
      dataModificacao: dataAlteracaoStatus,
      dataAlteracaoStatus,
    };

    this.salvarNoLocalStorage(formularios);
    return true;
  }

  private excluirDoLocalStorage(id: string): boolean {
    const formularios = this.obterDoLocalStorage();
    const formulariosAtualizados = formularios.filter((f) => f.id !== id);

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
      tipo: "criar",
      dados: this.prepararParaCache([formulario])[0],
      timestamp: Date.now(),
    });
    localStorage.setItem(this.chaveSync(), btoa(encodeURIComponent(JSON.stringify(pendentes))));
  }

  private salvarAtualizacaoParaSincronizar(id: string, dados: DadosFormulario): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    const operacao: OperacaoPendente = {
      tipo: "atualizar",
      id,
      dados: {
        dados,
        codigoOS: dados.codigoOS || `Sem código - ${id.slice(0, 6)}`,
        dataModificacao: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };
    pendentes.push(operacao);
    localStorage.setItem(this.chaveSync(), btoa(encodeURIComponent(JSON.stringify(pendentes))));
  }

  private salvarAtualizacaoStatusParaSincronizar(
    id: string,
    status: StatusFormulario,
    dataAlteracaoStatus: string = new Date().toISOString()
  ): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: "atualizar",
      id,
      dados: {
        status,
        dataModificacao: dataAlteracaoStatus,
        dataAlteracaoStatus,
      },
      timestamp: Date.now(),
    });
    localStorage.setItem(this.chaveSync(), btoa(encodeURIComponent(JSON.stringify(pendentes))));
  }

  private salvarExclusaoParaSincronizar(id: string): void {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    pendentes.push({
      tipo: "excluir",
      id,
      timestamp: Date.now(),
    });
    localStorage.setItem(this.chaveSync(), btoa(encodeURIComponent(JSON.stringify(pendentes))));
  }

  private obterDadosPendentesParaSincronizar(): OperacaoPendente[] {
    try {
      const data = localStorage.getItem(this.chaveSync());
      if (!data) return [];
      
      let dataStr;
      try {
        dataStr = decodeURIComponent(atob(data));
      } catch {
        dataStr = data; // Fallback
      }
      return JSON.parse(dataStr);
    } catch (error) {
      logger.error("Erro ao obter dados pendentes:", error);
      return [];
    }
  }

  // Verificar se há dados pendentes para sincronizar
  temDadosPendentes(): boolean {
    const pendentes = this.obterDadosPendentesParaSincronizar();
    return pendentes.length > 0;
  }

  /**
   * Limpa o cache e, opcionalmente, as O.S. do Firestore.
   * Exige confirmação explícita e, por padrão, limita a exclusão ao usuário atual.
   * Para limpar tudo (somente admin), passe `{ confirmado: true, uid: null }`.
   */
  async limparTodos(
    opcoes: { confirmado: boolean; uid?: string | null } = { confirmado: false }
  ): Promise<void> {
    if (!opcoes.confirmado) {
      logger.warn("limparTodos ignorado: confirmação explícita necessária.");
      return;
    }

    const uid = "uid" in opcoes ? opcoes.uid : this.uidAtual();
    localStorage.removeItem(this.chaveStorage(uid));
    localStorage.removeItem(this.chaveSync(uid));

    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const base = collection(db, COLLECTION_NAME);
        const q = uid ? query(base, where("criadoPor.uid", "==", uid)) : query(base);
        const querySnapshot = await getDocs(q);
        await Promise.all(querySnapshot.docs.map((documento) => deleteDoc(documento.ref)));
      } catch (error) {
        logger.error("Erro ao limpar Firebase:", error);
      }
    }
  }
}

// Exportar instância única do serviço
export const firebaseFormularioStorage = new FirebaseFormularioStorageService();
