import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { UsuarioStatus, criarUsuarioStatus } from '../types/usuario';
import { logger } from '../utils/logger';

class UserService {
  private readonly COLLECTION_USERS = 'users';
  private readonly COLLECTION_ADMIN = 'admin_settings';

  // Criar registro de usuário após registro Firebase
  async criarUsuarioStatus(uid: string, email: string, displayName?: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      logger.warn('Firebase não configurado - usuário não salvo no Firestore');
      return;
    }

    try {
      const usuarioStatus = criarUsuarioStatus(uid, email, displayName);

      const docData = {
        ...usuarioStatus,
        dataCriacao: Timestamp.fromDate(usuarioStatus.dataCriacao),
        displayName: usuarioStatus.displayName || null
      };

      await setDoc(doc(db, this.COLLECTION_USERS, uid), docData);

      // Enviar notificação para admin
      await this.enviarNotificacaoNovoUsuario(usuarioStatus);
    } catch (error) {
      logger.error('Erro ao criar status do usuário:', error);
      throw new Error('Erro interno ao processar registro');
    }
  }

  // Verificar se usuário está aprovado
  async verificarStatusUsuario(uid: string): Promise<UsuarioStatus | null> {
    if (!isFirebaseConfigured() || !db) {
      logger.warn('Firebase não configurado - assumindo usuário aprovado');
      return null;
    }

    try {
      // Primeiro, verificar se é admin
      const ehAdmin = await this.verificarSeEhAdmin(uid);
      
      const docRef = doc(db, this.COLLECTION_USERS, uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Se é admin mas não tem status, criar e aprovar automaticamente
        if (ehAdmin) {
          logger.log('👑 Admin detectado sem status - criando e aprovando automaticamente');
          await this.criarUsuarioStatus(uid, 'admin@sistema.com', 'Administrador');
          await this.aprovarUsuario(uid, 'sistema-auto');
          
          return {
            uid,
            email: 'admin@sistema.com',
            displayName: 'Administrador',
            status: 'aprovado',
            dataCriacao: new Date(),
            dataAprovacao: new Date(),
            aprovadoPor: 'sistema-auto'
          };
        }
        
        logger.warn('Usuário não encontrado no Firestore');
        return null;
      }

      const data = docSnap.data();
      const statusUsuario = {
        ...data,
        dataCriacao: data.dataCriacao?.toDate() || new Date(),
        dataAprovacao: data.dataAprovacao?.toDate()
      } as UsuarioStatus;
      
      // Se é admin mas ainda não aprovado, aprovar automaticamente
      if (ehAdmin && statusUsuario.status !== 'aprovado') {
        logger.log('👑 Admin detectado pendente - aprovando automaticamente');
        await this.aprovarUsuario(uid, 'sistema-auto');
        statusUsuario.status = 'aprovado';
        statusUsuario.dataAprovacao = new Date();
        statusUsuario.aprovadoPor = 'sistema-auto';
      }
      
      return statusUsuario;
    } catch (error) {
      logger.error('Erro ao verificar status:', error);
      return null;
    }
  }

  // Listar usuários pendentes (para admin)
  async listarUsuariosPendentes(): Promise<UsuarioStatus[]> {
    if (!isFirebaseConfigured() || !db) {
      logger.warn('Firebase não configurado - retornando lista vazia');
      return [];
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_USERS),
        where('status', '==', 'pendente')
      );

      const querySnapshot = await getDocs(q);

      const usuarios = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dataCriacao: data.dataCriacao?.toDate() || new Date(),
          dataAprovacao: data.dataAprovacao?.toDate()
        } as UsuarioStatus;
      });

      return usuarios;
    } catch (error) {
      logger.error('Erro ao listar usuários pendentes:', error);
      return [];
    }
  }

  // Aprovar usuário
  async aprovarUsuario(uid: string, aprovadoPor: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase não configurado');
    }

    try {
      const docRef = doc(db, this.COLLECTION_USERS, uid);
      await updateDoc(docRef, {
        status: 'aprovado',
        dataAprovacao: Timestamp.now(),
        aprovadoPor
      });

      logger.log('✅ Usuário aprovado com sucesso');
    } catch (error) {
      logger.error('Erro ao aprovar usuário:', error);
      throw new Error('Erro ao aprovar usuário');
    }
  }

  // Rejeitar usuário
  async rejeitarUsuario(uid: string, motivo: string, rejeitadoPor: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase não configurado');
    }

    try {
      const docRef = doc(db, this.COLLECTION_USERS, uid);
      await updateDoc(docRef, {
        status: 'rejeitado',
        dataAprovacao: Timestamp.now(),
        motivoRejeicao: motivo,
        aprovadoPor: rejeitadoPor
      });

      logger.log('✅ Usuário rejeitado com sucesso');
    } catch (error) {
      logger.error('Erro ao rejeitar usuário:', error);
      throw new Error('Erro ao rejeitar usuário');
    }
  }

  // Verificar se usuário é admin
  async verificarSeEhAdmin(uid: string): Promise<boolean> {
    if (!isFirebaseConfigured() || !db) {
      return false;
    }

    try {
      const docRef = doc(db, this.COLLECTION_ADMIN, 'admins');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return false;
      }

      const data = docSnap.data();
      return data.lista?.includes(uid) || false;
    } catch (error) {
      logger.error('Erro ao verificar admin:', error);
      return false;
    }
  }

  // Verificar se há algum administrador no sistema
  async verificarSeHaAdministradores(): Promise<boolean> {
    if (!isFirebaseConfigured() || !db) {
      return false;
    }

    try {
      const docRef = doc(db, this.COLLECTION_ADMIN, 'admins');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return false;
      }

      const data = docSnap.data();
      const listaAdmins = data.lista || [];
      return Array.isArray(listaAdmins) && listaAdmins.length > 0;
    } catch (error) {
      logger.error('Erro ao verificar se há administradores:', error);
      return false;
    }
  }

  // Enviar notificação de novo usuário (simulação - você pode integrar com serviço real)
  private async enviarNotificacaoNovoUsuario(usuario: UsuarioStatus): Promise<void> {
    try {
      logger.log('📧 Nova solicitação de acesso recebida — verifique o painel admin.');

      // Aqui você pode integrar com:
      // - EmailJS para envio direto
      // - API de email do seu servidor
      // - Webhook/notificação push
      // - Telegram Bot
      // - Etc.

      // TODO: Implementar envio real de email/webhook aqui
      
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
    }
  }
}

export const userService = new UserService();
