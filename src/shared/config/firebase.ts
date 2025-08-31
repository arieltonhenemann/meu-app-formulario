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
  apiKey: "AIzaSyB7CDMu5L9AycmtY5MkCWjaEdwgXobJePQ",
  authDomain: "formulario-os-2025.firebaseapp.com",
  projectId: "formulario-os-2025",
  storageBucket: "formulario-os-2025.firebasestorage.app",
  messagingSenderId: "944901924832",
  appId: "1:944901924832:web:a1081ad0c52bd9ec53ad85"
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
