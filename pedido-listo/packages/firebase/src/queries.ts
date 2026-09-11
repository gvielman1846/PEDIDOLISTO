import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Business, Category, Product } from '@pedido-listo/types';
import { getDb } from './config';

function mapBusiness(id: string, data: DocumentData): Business {
  return {
    id,
    name: data.name,
    slug: data.slug,
    whatsapp: data.whatsapp,
    logoUrl: data.logoUrl,
    address: data.address,
    deliveryFee: data.deliveryFee ?? 0,
    minOrder: data.minOrder ?? 0,
    openTime: data.openTime,
    closeTime: data.closeTime,
    isOpen: data.isOpen,
    plan: data.plan ?? 'free',
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
  };
}

function mapCategory(id: string, data: DocumentData): Category {
  return { id, name: data.name, order: data.order ?? 0 };
}

function mapProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: data.name,
    description: data.description ?? '',
    price: data.price,
    categoryId: data.categoryId,
    imageUrl: data.imageUrl,
    emoji: data.emoji,
    available: data.available ?? true,
    order: data.order ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
  };
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const db = getDb();
  const q = query(collection(db, 'businesses'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return mapBusiness(docSnap.id, docSnap.data());
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'businesses', businessId));
  if (!snap.exists()) return null;
  return mapBusiness(snap.id, snap.data());
}

export async function getCategories(businessId: string): Promise<Category[]> {
  const db = getDb();
  const q = query(
    collection(db, 'businesses', businessId, 'categories'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCategory(d.id, d.data()));
}

export async function getProducts(businessId: string): Promise<Product[]> {
  const db = getDb();
  const q = query(
    collection(db, 'businesses', businessId, 'products'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapProduct(d.id, d.data()));
}

export function subscribeToProducts(
  businessId: string,
  onChange: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, 'businesses', businessId, 'products'),
    orderBy('order', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => mapProduct(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  emoji?: string;
  imageUrl?: string;
  order: number;
}

/**
 * Reserva el id antes de escribir, para poder subir la imagen a una ruta que ya
 * conoce el producto y crear el documento una sola vez, con todo o con nada.
 */
export function newProductId(businessId: string): string {
  const db = getDb();
  return doc(collection(db, 'businesses', businessId, 'products')).id;
}

export async function createProduct(
  businessId: string,
  productId: string,
  input: CreateProductInput
): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'businesses', businessId, 'products', productId), {
    name: input.name,
    description: input.description,
    price: input.price,
    categoryId: input.categoryId,
    emoji: input.emoji ?? null,
    imageUrl: input.imageUrl ?? null,
    available: true,
    order: input.order,
    createdAt: serverTimestamp(),
  });
}

export async function updateProductAvailability(
  businessId: string,
  productId: string,
  available: boolean
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, 'businesses', businessId, 'products', productId), { available });
}

export async function updateProduct(
  businessId: string,
  productId: string,
  input: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    emoji?: string;
    imageUrl?: string;
  }
): Promise<void> {
  const db = getDb();
  const data: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    price: input.price,
    categoryId: input.categoryId,
    emoji: input.emoji ?? null,
  };

  if (input.imageUrl) data.imageUrl = input.imageUrl;

  await updateDoc(doc(db, 'businesses', businessId, 'products', productId), data);
}

export async function deleteProduct(businessId: string, productId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'businesses', businessId, 'products', productId));
}

export interface CatalogData {
  business: Business;
  categories: Category[];
  products: Product[];
}

export async function loadCatalogBySlug(slug: string): Promise<CatalogData | null> {
  const business = await getBusinessBySlug(slug);
  if (!business?.id) return null;

  const [categories, products] = await Promise.all([
    getCategories(business.id),
    getProducts(business.id),
  ]);

  return { business, categories, products };
}
