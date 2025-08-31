import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  UserCredential 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Apenas inicializar listeners se Firebase está configurado
    if (isFirebaseConfigured() && auth) {
      this.initializeAuthListener();
    }
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth!, (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
      } else {
        this.currentUser = null;
      }
      
      // Notificar todos os listeners
      this.listeners.forEach(listener => listener(this.currentUser));
    });
  }

  // Registrar novo usuário
  async registrar(email: string, password: string): Promise<AuthUser> {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase Authentication não configurado');
    }

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      };
      
      console.log('✅ Usuário registrado com sucesso:', authUser.email);
      return authUser;
    } catch (error: any) {
      console.error('❌ Erro ao registrar usuário:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Fazer login
  async login(email: string, password: string): Promise<AuthUser> {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase Authentication não configurado');
    }

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      };
      
      console.log('✅ Login realizado com sucesso:', authUser.email);
      return authUser;
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Fazer logout
  async logout(): Promise<void> {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase Authentication não configurado');
    }

    try {
      await signOut(auth);
      console.log('✅ Logout realizado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao fazer logout:', error);
      throw new Error('Erro ao fazer logout');
    }
  }

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Adicionar listener para mudanças de autenticação
  onAuthStateChange(listener: (user: AuthUser | null) => void) {
    this.listeners.push(listener);
    
    // Retornar função para remover listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Traduzir códigos de erro do Firebase
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado. Verifique o email.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Tente novamente.';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso. Tente fazer login.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'Email inválido. Verifique o formato.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente em alguns minutos.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      default:
        return 'Erro de autenticação. Tente novamente.';
    }
  }
}

// Exportar instância única
export const authService = new AuthService();
