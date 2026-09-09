import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  type DocumentData,
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
