import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const root = join(__dirname, '..');

export function loadEnv() {
  const path = join(root, 'apps/web-catalog/.env.local');
  const content = readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key?.startsWith('VITE_')) env[key] = rest.join('=').trim();
  }
  return env;
}

export function loadDemoMenu() {
  const path = join(root, 'apps/web-catalog/src/data/demo-menu.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let firebaseInstance;

export function initFirebase() {
  if (firebaseInstance) return firebaseInstance;

  const env = loadEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });

  firebaseInstance = {
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return firebaseInstance;
}

export async function signIn() {
  const firebase = initFirebase();
  console.log('Iniciando sesion anonima...');
  const { user } = await signInAnonymously(firebase.auth);
  console.log(`Autenticado como: ${user.uid}`);
  return { ...firebase, user };
}

export async function getBusinessBySlug(db, slug) {
  const q = query(collection(db, 'businesses'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
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

export async function seedBusiness(
  { db, storage, user },
  {
    businessId,
    name,
    slug,
    whatsapp,
    address,
    deliveryFee = 25,
    minOrder = 80,
    openTime = '09:00',
    closeTime = '20:00',
    isOpen = true,
    plan = 'free',
    menu,
    force = false,
  }
) {
  const existingBySlug = await getBusinessBySlug(db, slug);
  if (existingBySlug && existingBySlug.id !== businessId) {
    throw new Error(`El slug "${slug}" ya esta en uso por businesses/${existingBySlug.id}`);
  }

  const businessRef = doc(db, 'businesses', businessId);
  const existing = await getDoc(businessRef);

  if (existing.exists()) {
    const ownerId = existing.data().ownerId;
    if (ownerId && ownerId !== user.uid && !force) {
      throw new Error(
        `businesses/${businessId} ya tiene dueno. Usa otro id o reclama desde la app movil.`
      );
    }
    console.log(`Actualizando negocio: ${name}...`);
  } else {
    console.log(`Creando negocio: ${name}...`);
  }

  const businessData = {
    name,
    slug,
    whatsapp,
    address,
    deliveryFee,
    minOrder,
    openTime,
    closeTime,
    isOpen,
    plan,
    createdAt: serverTimestamp(),
  };

  await setDoc(businessRef, businessData, { merge: true });

  for (const category of menu.categories) {
    await setDoc(doc(db, 'businesses', businessId, 'categories', category.id), {
      name: category.name,
      order: category.order,
    });
  }
  console.log(`  Categorias: ${menu.categories.length}`);

  for (const product of menu.products) {
    let imageUrl = publicImageUrl(product.imageFile);
    try {
      imageUrl = await uploadProductImage(storage, businessId, product.id, product.imageFile);
    } catch (err) {
      console.warn(`  Imagen ${product.id}: ${err.message} -> ${imageUrl}`);
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
  console.log(`  Productos: ${menu.products.length}`);

  return {
    businessId,
    slug,
    catalogUrl: `/${slug}`,
  };
}
