import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../shared/config/firebase';

/**
 * Função de emergência para tornar um usuário em administrador.
 * Só funciona se VITE_ALLOW_EMERGENCY_ADMIN=true no .env.
 * Use apenas quando não há nenhum admin no sistema.
 * Após criar o primeiro admin, remova esta variável e recompile.
 */
export const makeUserAdmin = async (uid: string, email: string): Promise<void> => {
  if (import.meta.env.VITE_ALLOW_EMERGENCY_ADMIN !== 'true') {
    throw new Error('Função desabilitada. Defina VITE_ALLOW_EMERGENCY_ADMIN=true no .env para usar.');
  }

  try {
    console.log('🔧 Iniciando processo de emergência para criar administrador...');
    console.log('👤 UID do usuário:', uid);
    console.log('📧 Email do usuário:', email);

    // 1. Verificar se já existe lista de admins
    const adminDocRef = doc(db, 'admin_settings', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    
    let adminsList = [];
    if (adminDoc.exists()) {
      adminsList = adminDoc.data().lista || [];
      console.log('📋 Lista atual de admins:', adminsList);
    } else {
      console.log('📝 Criando nova lista de admins...');
    }

    // 2. Adicionar usuário à lista de admins se não estiver
    if (!adminsList.includes(uid)) {
      adminsList.push(uid);
      console.log('➕ Adicionando usuário à lista de admins...');
      
      await setDoc(adminDocRef, {
        lista: adminsList,
        ultimaAtualizacao: new Date()
      });
      
      console.log('✅ Usuário adicionado à lista de admins!');
    } else {
      console.log('ℹ️ Usuário já é administrador');
    }

    // 3. Aprovar o usuário automaticamente
    console.log('🔓 Aprovando usuário automaticamente...');
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.status !== 'aprovado') {
        await setDoc(userDocRef, {
          ...userData,
          status: 'aprovado',
          dataAprovacao: new Date(),
          aprovadoPor: 'sistema-emergencia'
        });
        console.log('✅ Usuário aprovado automaticamente!');
      } else {
        console.log('ℹ️ Usuário já estava aprovado');
      }
    } else {
      // Criar registro do usuário se não existir
      console.log('📝 Criando registro do usuário...');
      await setDoc(userDocRef, {
        uid: uid,
        email: email,
        displayName: email,
        status: 'aprovado',
        dataCriacao: new Date(),
        dataAprovacao: new Date(),
        aprovadoPor: 'sistema-emergencia'
      });
      console.log('✅ Registro do usuário criado e aprovado!');
    }

    console.log('🎉 PROCESSO CONCLUÍDO! O usuário agora é administrador.');
    console.log('🔄 Atualize a página para ver as mudanças.');
    
    return;
  } catch (error) {
    console.error('❌ Erro ao tornar usuário admin:', error);
    throw error;
  }
};

// Função para ser executada no console do navegador
export const makeCurrentUserAdmin = async (): Promise<void> => {
  if (import.meta.env.VITE_ALLOW_EMERGENCY_ADMIN !== 'true') {
    throw new Error('Função desabilitada. Defina VITE_ALLOW_EMERGENCY_ADMIN=true no .env para usar.');
  }

  try {
    // Tentar obter o usuário atual do Firebase Auth
    const auth = await import('../shared/config/firebase').then(m => m.auth);
    
    if (!auth?.currentUser) {
      throw new Error('Nenhum usuário logado encontrado');
    }
    
    const user = auth.currentUser;
    console.log('👤 Usuário atual detectado:', user.email);
    
    await makeUserAdmin(user.uid, user.email || 'admin@sistema.com');
    
  } catch (error) {
    console.error('❌ Erro ao tornar usuário atual admin:', error);
    throw error;
  }
};
