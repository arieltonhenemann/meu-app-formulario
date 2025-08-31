import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { UsuarioStatus, criarUsuarioStatus, SolicitacaoAprovacao } from '../types/usuario';

class UserService {
  private readonly COLLECTION_USERS = 'users';
  private readonly COLLECTION_ADMIN = 'admin_settings';

  // Criar registro de usuário após registro Firebase
  async criarUsuarioStatus(uid: string, email: string, displayName?: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      console.warn('Firebase não configurado - usuário não salvo no Firestore');
      return;
    }

    try {
      console.log('🔄 Iniciando criação de status para usuário:', { uid, email, displayName });
      const usuarioStatus = criarUsuarioStatus(uid, email, displayName);
      
      console.log('📝 Dados a serem salvos no Firestore:', usuarioStatus);
      
      const docData = {
        ...usuarioStatus,
        dataCriacao: Timestamp.fromDate(usuarioStatus.dataCriacao),
        // Garantir que campos undefined virem null (Firestore não aceita undefined)
        displayName: usuarioStatus.displayName || null
      };
      
      await setDoc(doc(db, this.COLLECTION_USERS, uid), docData);

      console.log('✅ Status do usuário criado no Firestore com sucesso!');
      console.log('📍 Coleção:', this.COLLECTION_USERS, 'Documento:', uid);

      // Verificar se foi salvo corretamente
      const docRef = doc(db, this.COLLECTION_USERS, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Confirmado: Documento existe no Firestore');
        console.log('📄 Dados salvos:', docSnap.data());
      } else {
        console.error('❌ ERRO: Documento não foi salvo no Firestore!');
      }

      // Enviar notificação para admin
      await this.enviarNotificacaoNovoUsuario(usuarioStatus);
    } catch (error) {
      console.error('❌ Erro ao criar status do usuário:', error);
      throw new Error('Erro interno ao processar registro');
    }
  }

  // Verificar se usuário está aprovado
  async verificarStatusUsuario(uid: string): Promise<UsuarioStatus | null> {
    if (!isFirebaseConfigured() || !db) {
      console.warn('Firebase não configurado - assumindo usuário aprovado');
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
          console.log('👑 Admin detectado sem status - criando e aprovando automaticamente');
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
        
        console.warn('Usuário não encontrado no Firestore');
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
        console.log('👑 Admin detectado pendente - aprovando automaticamente');
        await this.aprovarUsuario(uid, 'sistema-auto');
        statusUsuario.status = 'aprovado';
        statusUsuario.dataAprovacao = new Date();
        statusUsuario.aprovadoPor = 'sistema-auto';
      }
      
      return statusUsuario;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return null;
    }
  }

  // Listar usuários pendentes (para admin)
  async listarUsuariosPendentes(): Promise<UsuarioStatus[]> {
    if (!isFirebaseConfigured() || !db) {
      console.warn('Firebase não configurado - retornando lista vazia');
      return [];
    }

    try {
      console.log('🔍 Buscando usuários pendentes na coleção:', this.COLLECTION_USERS);
      
      // Primeiro, listar todos os documentos para debug
      const allDocsQuery = query(collection(db, this.COLLECTION_USERS));
      const allDocsSnapshot = await getDocs(allDocsQuery);
      
      console.log('📊 Total de documentos na coleção:', allDocsSnapshot.size);
      
      if (allDocsSnapshot.size > 0) {
        console.log('📋 Todos os usuários na base:');
        allDocsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${doc.id}: ${data.email} [${data.status}]`);
        });
      }
      
      // Agora buscar apenas os pendentes (sem orderBy para evitar erro de índice)
      const q = query(
        collection(db, this.COLLECTION_USERS),
        where('status', '==', 'pendente')
      );

      const querySnapshot = await getDocs(q);
      console.log('👥 Usuários pendentes encontrados:', querySnapshot.size);
      
      const usuarios = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📝 Usuário pendente:', { id: doc.id, email: data.email, status: data.status });
        return {
          ...data,
          dataCriacao: data.dataCriacao?.toDate() || new Date(),
          dataAprovacao: data.dataAprovacao?.toDate()
        } as UsuarioStatus;
      });
      
      return usuarios;
    } catch (error) {
      console.error('❌ Erro ao listar usuários pendentes:', error);
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

      console.log('✅ Usuário aprovado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aprovar usuário:', error);
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

      console.log('✅ Usuário rejeitado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao rejeitar usuário:', error);
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
      console.error('❌ Erro ao verificar admin:', error);
      return false;
    }
  }

  // Enviar notificação de novo usuário (simulação - você pode integrar com serviço real)
  private async enviarNotificacaoNovoUsuario(usuario: UsuarioStatus): Promise<void> {
    try {
      console.log('📧 Nova solicitação de acesso recebida:');
      console.log('- Email:', usuario.email);
      console.log('- UID:', usuario.uid);
      console.log('- Data:', usuario.dataCriacao);

      // Aqui você pode integrar com:
      // - EmailJS para envio direto
      // - API de email do seu servidor
      // - Webhook/notificação push
      // - Telegram Bot
      // - Etc.

      // Exemplo de payload para webhook:
      const notificationPayload = {
        type: 'new_user_registration',
        usuario: {
          email: usuario.email,
          uid: usuario.uid,
          dataCriacao: usuario.dataCriacao.toISOString(),
        },
        message: `Novo usuário "${usuario.email}" solicitou acesso ao sistema.`,
        actionUrl: `${window.location.origin}/admin/usuarios` // URL para aprovar
      };

      console.log('📤 Payload de notificação:', notificationPayload);
      
      // TODO: Implementar envio real de email/webhook aqui
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }
}

export const userService = new UserService();
