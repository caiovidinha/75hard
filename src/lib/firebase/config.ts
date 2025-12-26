// Firebase Configuration
// Arquivo principal de configuração do Firebase com inicialização singleton

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração do Firebase (valores do .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validação das variáveis de ambiente (apenas no client-side)
if (typeof window !== 'undefined') {
  const missingVars = [];
  
  if (!firebaseConfig.apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  
  if (missingVars.length > 0) {
    console.error('Variáveis de ambiente faltando:', missingVars);
    console.error('firebaseConfig atual:', firebaseConfig);
    throw new Error(
      `Firebase não configurado. Variáveis faltando: ${missingVars.join(', ')}`
    );
  }
}

// Singleton: inicializa apenas uma vez
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Inicialização do Firebase (apenas client-side)
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado com sucesso');
  } else {
    app = getApps()[0];
  }
  
  // Inicializa serviços básicos (Auth e Firestore)
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Configura persistência LOCAL para manter login no PWA
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Persistência de Auth configurada: LOCAL (mantém login)');
    })
    .catch((error) => {
      console.error('❌ Erro ao configurar persistência:', error);
    });
}

// Lazy loading do Storage (apenas quando necessário, apenas client-side)
export async function getStorageInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Storage só pode ser usado no client-side');
  }
  
  const { getStorage } = await import('firebase/storage');
  return getStorage(app);
}

// Lazy loading do Analytics (apenas quando necessário, apenas client-side)
export async function getAnalyticsInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Analytics só pode ser usado no client-side');
  }
  
  const { getAnalytics } = await import('firebase/analytics');
  return getAnalytics(app);
}

// Exports
export { app, auth, db };
