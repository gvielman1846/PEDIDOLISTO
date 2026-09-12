import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

function getEnv(key: string): string {
  try {
    // Vite reemplaza `import.meta.env` solo cuando se lee en esta misma expresion.
    // Guardar `import.meta` en una variable deja el build sin configuracion.
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env) {
      return env[key] ?? '';
    }
  } catch {
    // not in Vite context
  }
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const env = (globalThis as { process?: { env?: Record<string, string> } }).process?.env;
    return env?.[key] ?? '';
  }
  return '';
}

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]!;
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

/**
 * React Native necesita `initializeAuth` con persistencia de AsyncStorage; sin eso
 * cada recarga genera un uid anonimo nuevo. La app movil registra su instancia aqui.
 */
export function setFirebaseAuth(instance: Auth): void {
  auth = instance;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}
