/**
 * Seed demo business + menu for PedidoListo.
 * Requires: Anonymous Auth enabled + Firestore rules deployed.
 * Run: npm run firebase:deploy && npm run seed:demo
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    if (key?.startsWith('VITE_')) env[key] = rest.join('=').trim();
  }
  return env;
}

const categories = [
  { id: 'antojitos', name: 'Antojitos', order: 0 },
  { id: 'platos', name: 'Platos fuertes', order: 1 },
  { id: 'bebidas', name: 'Bebidas', order: 2 },
  { id: 'postres', name: 'Postres', order: 3 },
];

const products = [
  { id: '1', name: 'Tacos de guisado (3 pzas)', description: 'Tinga, picadillo o chicharrón', price: 45, categoryId: 'antojitos', emoji: '🌮', available: true, order: 0 },
  { id: '2', name: 'Quesadilla grande', description: 'Tortilla de maíz, queso Oaxaca', price: 35, categoryId: 'antojitos', emoji: '🧀', available: true, order: 1 },
  { id: '3', name: 'Enchiladas verdes', description: 'Pollo, arroz y frijoles', price: 95, categoryId: 'platos', emoji: '🍽️', available: true, order: 0 },
  { id: '4', name: 'Mole con pollo', description: '2 piezas, arroz y tortillas', price: 110, categoryId: 'platos', emoji: '🍗', available: true, order: 1 },
  { id: '5', name: 'Pozole chico', description: 'Cerdo o pollo, 500 ml', price: 75, categoryId: 'platos', emoji: '🥣', available: true, order: 2 },
  { id: '6', name: 'Agua de horchata', description: '1 litro', price: 40, categoryId: 'bebidas', emoji: '🥤', available: true, order: 0 },
  { id: '7', name: 'Refresco 600 ml', description: 'Coca, Sprite o Manzanita', price: 25, categoryId: 'bebidas', emoji: '🧃', available: true, order: 1 },
  { id: '8', name: 'Flan napolitano', description: 'Porción individual', price: 35, categoryId: 'postres', emoji: '🍮', available: true, order: 0 },
];

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

const businessData = {
  name: 'Cocina Chef Cueto',
  slug: 'cocina-chef-cueto',
  whatsapp: '525513690163',
  address: 'Alta California Residencial, Tlajomulco',
  deliveryFee: 25,
  minOrder: 80,
  openTime: '09:00',
  closeTime: '20:00',
  isOpen: true,
  plan: 'free',
  createdAt: serverTimestamp(),
};

console.log('Iniciando sesion anonima...');
const { user } = await signInAnonymously(auth);
console.log(`Autenticado como: ${user.uid}`);

const ref = doc(db, 'businesses', businessId);
const existing = await getDoc(ref);

if (existing.exists()) {
  const ownerId = existing.data().ownerId;
  if (ownerId && ownerId !== user.uid) {
    throw new Error(
      `businesses/${businessId} ya tiene dueno (${ownerId}). Borra el documento en Firebase Console o usa ese dueno.`
    );
  }
  console.log('Actualizando negocio demo existente...');
  await setDoc(ref, businessData, { merge: true });
} else {
  console.log('Creando negocio demo...');
  await setDoc(ref, businessData);
}

for (const category of categories) {
  await setDoc(doc(db, 'businesses', businessId, 'categories', category.id), {
    name: category.name,
    order: category.order,
  });
}
console.log(`Categorias: ${categories.length}`);

for (const product of products) {
  await setDoc(doc(db, 'businesses', businessId, 'products', product.id), {
    name: product.name,
    description: product.description,
    price: product.price,
    categoryId: product.categoryId,
    emoji: product.emoji,
    available: product.available,
    order: product.order,
    createdAt: serverTimestamp(),
  });
}
console.log(`Productos: ${products.length}`);

console.log(`Negocio demo listo: businesses/${businessId}`);
console.log(`Catalogo web: /${businessData.slug}`);
