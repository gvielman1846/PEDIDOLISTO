/**
 * Seed demo business + menu + product images for PedidoListo.
 * Requires: Anonymous Auth enabled + Firestore/Storage rules deployed.
 * Run: npm run firebase:deploy && npm run seed:demo
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

function loadDemoMenu() {
  const path = join(root, 'apps/web-catalog/src/data/demo-menu.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

function publicImageUrl(imageFile) {
  return `/images/products/${imageFile}`;
}

async function uploadProductImage(storage, businessId, productId, imageFile) {
  const localPath = join(root, 'assets/demo-products', imageFile);
  const buffer = readFileSync(localPath);
  const ext = imageFile.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  const path = `businesses/${businessId}/products/${productId}.${ext}`;
  const fileRef = ref(storage, path);

  const upload = uploadBytes(fileRef, buffer, { contentType }).then(() => getDownloadURL(fileRef));
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Storage upload timeout')), 15000);
  });

  return Promise.race([upload, timeout]);
}

const { categories, products } = loadDemoMenu();

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
const storage = getStorage(app);
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

const businessRef = doc(db, 'businesses', businessId);
const existing = await getDoc(businessRef);

if (existing.exists()) {
  const ownerId = existing.data().ownerId;
  if (ownerId && ownerId !== user.uid) {
    throw new Error(
      `businesses/${businessId} ya tiene dueno (${ownerId}). Borra el documento en Firebase Console o usa ese dueno.`
    );
  }
  console.log('Actualizando negocio demo existente...');
  await setDoc(businessRef, businessData, { merge: true });
} else {
  console.log('Creando negocio demo...');
  await setDoc(businessRef, businessData);
}

for (const category of categories) {
  await setDoc(doc(db, 'businesses', businessId, 'categories', category.id), {
    name: category.name,
    order: category.order,
  });
}
console.log(`Categorias: ${categories.length}`);

for (const product of products) {
  let imageUrl = publicImageUrl(product.imageFile);
  try {
    console.log(`Subiendo imagen: ${product.name}...`);
    imageUrl = await uploadProductImage(storage, businessId, product.id, product.imageFile);
    console.log(`  -> Storage OK`);
  } catch (err) {
    console.warn(`  -> Storage fallo (${err.message}), usando ${imageUrl}`);
  }

  await setDoc(doc(db, 'businesses', businessId, 'products', product.id), {
    name: product.name,
    description: product.description,
    price: product.price,
    categoryId: product.categoryId,
    emoji: product.emoji,
    imageUrl,
    available: product.available,
    order: product.order,
    createdAt: serverTimestamp(),
  });
}
console.log(`Productos: ${products.length} (con fotos en Storage)`);

console.log(`Negocio demo listo: businesses/${businessId}`);
console.log(`Catalogo web: /${businessData.slug}`);
