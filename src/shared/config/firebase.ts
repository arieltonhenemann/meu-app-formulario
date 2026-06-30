import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { logger } from "../utils/logger";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "your_api_key_here" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "your_project_id_here"
  );
};

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    logger.log("✅ Firebase configurado e inicializado com sucesso!");
  } catch (error) {
    logger.warn("⚠️ Erro ao inicializar Firebase:", error);
  }
} else {
  logger.log("📝 Firebase não configurado - usando apenas localStorage");
}

export { db, auth, isFirebaseConfigured };
export default app;

