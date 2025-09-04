// Serviço de auditoria para logs de ações dos usuários
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { 
  LogAuditoria, 
  TipoAcaoAuditoria, 
  UsuarioAuditoria, 
  DetalhesAcao,
  criarLogAuditoria
} from '../types/auditoria';

const COLLECTION_NAME = 'logs_auditoria';
const STORAGE_KEY = 'logs_auditoria_local';
const MAX_LOGS_LOCAIS = 500; // Limitar logs locais para não sobrecarregar

class AuditoriaService {
  private isOnline = navigator.onLine;
  
  constructor() {
    // Monitorar status de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sincronizarLogs();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Verificar se Firebase está configurado
  private isFirebaseConfigured(): boolean {
    try {
      return db !== null && typeof db === 'object' && isFirebaseConfigured();
    } catch (error) {
      console.warn('Firebase não configurado para auditoria:', error);
      return false;
    }
  }

  // Registrar uma ação de auditoria
  async registrarAcao(
    acao: TipoAcaoAuditoria,
    usuario: UsuarioAuditoria,
    detalhes: DetalhesAcao
  ): Promise<void> {
    const log = criarLogAuditoria(acao, usuario, detalhes);
    
    // Sempre salvar localmente primeiro
    this.salvarLogLocal(log);
    
    // Tentar salvar no Firebase se online
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        const { id, ...logSemId } = log;
        await addDoc(collection(db, COLLECTION_NAME), logSemId);
        console.log('Log de auditoria salvo:', log.acao, log.detalhes.codigoOS);
      } catch (error) {
        console.error('Erro ao salvar log no Firebase (ficará pendente):', error);
        // Log fica salvo localmente para sincronização posterior
      }
    }
  }

  // Obter todos os logs (com limite opcional)
  async obterLogs(limite?: number): Promise<LogAuditoria[]> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        let q = query(
          collection(db, COLLECTION_NAME),
          orderBy('timestamp', 'desc')
        );
        
        if (limite) {
          q = query(q, limit(limite));
        }
        
        const querySnapshot = await getDocs(q);
        const logs: LogAuditoria[] = [];
        
        querySnapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data()
          } as LogAuditoria);
        });
        
        // Salvar como cache local
        this.salvarCacheLocal(logs);
        
        return logs;
      } catch (error) {
        console.error('Erro ao buscar logs no Firebase, usando cache local:', error);
        return this.obterLogsLocais();
      }
    } else {
      return this.obterLogsLocais();
    }
  }

  // Filtrar logs por usuário
  async obterLogsPorUsuario(uid: string, limite?: number): Promise<LogAuditoria[]> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        let q = query(
          collection(db, COLLECTION_NAME),
          where('usuario.uid', '==', uid),
          orderBy('timestamp', 'desc')
        );
        
        if (limite) {
          q = query(q, limit(limite));
        }
        
        const querySnapshot = await getDocs(q);
        const logs: LogAuditoria[] = [];
        
        querySnapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data()
          } as LogAuditoria);
        });
        
        return logs;
      } catch (error) {
        console.error('Erro ao filtrar logs por usuário:', error);
        // Fallback: filtrar dos logs locais
        const logsLocais = this.obterLogsLocais();
        return logsLocais.filter(log => log.usuario.uid === uid);
      }
    } else {
      const logsLocais = this.obterLogsLocais();
      return logsLocais.filter(log => log.usuario.uid === uid);
    }
  }

  // Filtrar logs por ação
  async obterLogsPorAcao(acao: TipoAcaoAuditoria, limite?: number): Promise<LogAuditoria[]> {
    if (this.isOnline && this.isFirebaseConfigured()) {
      try {
        let q = query(
          collection(db, COLLECTION_NAME),
          where('acao', '==', acao),
          orderBy('timestamp', 'desc')
        );
        
        if (limite) {
          q = query(q, limit(limite));
        }
        
        const querySnapshot = await getDocs(q);
        const logs: LogAuditoria[] = [];
        
        querySnapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data()
          } as LogAuditoria);
        });
        
        return logs;
      } catch (error) {
        console.error('Erro ao filtrar logs por ação:', error);
        // Fallback: filtrar dos logs locais
        const logsLocais = this.obterLogsLocais();
        return logsLocais.filter(log => log.acao === acao);
      }
    } else {
      const logsLocais = this.obterLogsLocais();
      return logsLocais.filter(log => log.acao === acao);
    }
  }

  // Obter estatísticas de ações
  async obterEstatisticasAcoes(): Promise<{
    total: number;
    porAcao: Record<TipoAcaoAuditoria, number>;
    ultimasSemanas: { semana: string; total: number }[];
  }> {
    const logs = await this.obterLogs();
    
    const porAcao = logs.reduce((acc, log) => {
      acc[log.acao] = (acc[log.acao] || 0) + 1;
      return acc;
    }, {} as Record<TipoAcaoAuditoria, number>);
    
    // Estatísticas das últimas 4 semanas
    const agora = new Date();
    const ultimasSemanas = [];
    
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(agora);
      inicioSemana.setDate(agora.getDate() - (i * 7));
      inicioSemana.setHours(0, 0, 0, 0);
      
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);
      
      const logsNaSemana = logs.filter(log => {
        const dataLog = new Date(log.timestamp);
        return dataLog >= inicioSemana && dataLog <= fimSemana;
      });
      
      ultimasSemanas.push({
        semana: `${inicioSemana.toLocaleDateString('pt-BR')} - ${fimSemana.toLocaleDateString('pt-BR')}`,
        total: logsNaSemana.length
      });
    }
    
    return {
      total: logs.length,
      porAcao,
      ultimasSemanas
    };
  }

  // === MÉTODOS PRIVADOS ===

  private salvarLogLocal(log: LogAuditoria): void {
    try {
      const logsExistentes = this.obterLogsLocais();
      logsExistentes.unshift(log); // Adicionar no início
      
      // Limitar o número de logs locais
      if (logsExistentes.length > MAX_LOGS_LOCAIS) {
        logsExistentes.splice(MAX_LOGS_LOCAIS);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsExistentes));
    } catch (error) {
      console.error('Erro ao salvar log localmente:', error);
    }
  }

  private obterLogsLocais(): LogAuditoria[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar logs locais:', error);
      return [];
    }
  }

  private salvarCacheLocal(logs: LogAuditoria[]): void {
    try {
      // Manter apenas os mais recentes para cache
      const logsCache = logs.slice(0, MAX_LOGS_LOCAIS);
      localStorage.setItem(STORAGE_KEY + '_cache', JSON.stringify(logsCache));
    } catch (error) {
      console.error('Erro ao salvar cache de logs:', error);
    }
  }

  private async sincronizarLogs(): Promise<void> {
    if (!this.isOnline || !this.isFirebaseConfigured()) return;

    try {
      const logsLocais = this.obterLogsLocais();
      const cacheRemoto = this.obterCacheLocal();
      
      // Encontrar logs que não estão no Firebase ainda
      const logsParaSincronizar = logsLocais.filter(logLocal => 
        !cacheRemoto.some(cacheLog => cacheLog.id === logLocal.id)
      );
      
      // Sincronizar logs pendentes
      for (const log of logsParaSincronizar) {
        try {
          const { id, ...logSemId } = log;
          await addDoc(collection(db, COLLECTION_NAME), logSemId);
        } catch (error) {
          console.error('Erro ao sincronizar log:', log.id, error);
        }
      }
      
      if (logsParaSincronizar.length > 0) {
        console.log(`${logsParaSincronizar.length} logs sincronizados com sucesso!`);
      }
    } catch (error) {
      console.error('Erro na sincronização de logs:', error);
    }
  }

  private obterCacheLocal(): LogAuditoria[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY + '_cache');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  // Status da conexão
  estaOnline(): boolean {
    return this.isOnline && this.isFirebaseConfigured();
  }
}

// Exportar instância única do serviço
export const auditoriaService = new AuditoriaService();
