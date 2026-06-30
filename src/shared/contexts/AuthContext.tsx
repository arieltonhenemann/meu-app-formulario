import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registrar: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  redefinirSenha: (email: string) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const verificarAdmin = async (uid: string) => {
    setCheckingAdmin(true);
    try {
      const ehAdmin = await userService.verificarSeEhAdmin(uid);
      setIsAdmin(ehAdmin);
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Bypass de autenticação restrito ao ambiente de desenvolvimento local.
    // NUNCA funcionará em produção pois a variável VITE_DEV_BYPASS não é incluída no build.
    // Para ativar, adicione VITE_DEV_BYPASS=true no arquivo .env (que está no .gitignore).
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true') {
      setUser({
        uid: 'bypass-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        isApproved: true
      });
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    // O listener já dispara uma vez com o estado atual ao ser registrado,
    // tornando desnecessária qualquer leitura manual do usuário corrente.
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser?.uid) {
        verificarAdmin(authUser.uid);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authUser = await authService.login(email, password);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registrar = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authUser = await authService.registrar(email, password);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const redefinirSenha = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.redefinirSenha(email);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (user?.uid) {
      await verificarAdmin(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isAdmin,
    checkingAdmin,
    login,
    registrar,
    logout,
    redefinirSenha,
    refreshAdminStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
