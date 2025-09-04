// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// IMPORTANTE: Substitua pelas suas credenciais do Firebase
// Para obter essas informações:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto
// 3. Adicione um app web
// 4. Copie a configuração aqui
const firebaseConfig = {
  apiKey: "AIzaSyCnH1IiM1dYHTEWvv3N-tks9zjvta0dpxY",
  authDomain: "cadastros-equipamentos.firebaseapp.com",
  projectId: "cadastros-equipamentos",
  storageBucket: "cadastros-equipamentos.firebasestorage.app",
  messagingSenderId: "989457399548",
  appId: "1:989457399548:web:ec6475bd02aa1eabb8e179"
};

// Verificar se Firebase está configurado
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "sua-api-key-aqui" && 
         firebaseConfig.projectId !== "seu-projeto-id";
};

// Inicializar Firebase apenas se configurado
let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase configurado e inicializado com sucesso!');
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar Firebase:', error);
  }
} else {
  console.log('📝 Firebase não configurado - usando apenas localStorage');
}

export { db, auth, isFirebaseConfigured };

// Para desenvolvimento local (opcional)
// Descomente as linhas abaixo se quiser usar o emulador do Firebase
// if (location.hostname === 'localhost') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export default app;
