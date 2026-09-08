/**
 * Seed demo business for PedidoListo.
 * Requires: Anonymous Auth enabled in Firebase Console.
 * Run: node scripts/seed-demo.mjs
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const path = join(root, 'apps/web-catalog/.env.local');
  const content = readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key?.startsWith('VITE_')) env[key] = rest.join('=');
  }
  return env;
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);
const businessId = 'demo';

console.log('Iniciando sesion anonima...');
const { user } = await signInAnonymously(auth);
console.log(`Autenticado como: ${user.uid}`);

await setDoc(
  doc(db, 'businesses', businessId),
  {
    name: 'Cocina de Doña Carmen',
    slug: 'cocina-dona-carmen',
    whatsapp: '525513690163',
    address: 'Col. Centro, CDMX',
    deliveryFee: 25,
    minOrder: 80,
    openTime: '09:00',
    closeTime: '20:00',
    isOpen: true,
    plan: 'free',
    createdAt: new Date(),
  },
  { merge: true }
);

console.log(`Negocio demo creado: businesses/${businessId}`);
console.log('Abre la app movil para reclamar ownership al iniciar.');
