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
import type { Business, Category, Product, PaymentMethod } from '@pedido-listo/types';
import { PAYMENT_METHODS } from '@pedido-listo/types';
import { getDb } from './config';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'antojitos', name: 'Antojitos', order: 0 },
  { id: 'platos', name: 'Platos fuertes', order: 1 },
  { id: 'bebidas', name: 'Bebidas', order: 2 },
  { id: 'postres', name: 'Postres', order: 3 },
];

function mapBusiness(id: string, data: DocumentData): Business {
  return {
    id,
    ownerId: data.ownerId,
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
    paymentMethods: Array.isArray(data.paymentMethods)
      ? data.paymentMethods.filter((method: PaymentMethod) => PAYMENT_METHODS.includes(method))
      : undefined,
    clabe: data.clabe ?? undefined,
    mercadoPagoConnected: Boolean(data.mercadoPagoConnected),
    mercadoPagoNickname: data.mercadoPagoNickname ?? undefined,
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

export async function getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
  const db = getDb();
  const q = query(collection(db, 'businesses'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((item) => mapBusiness(item.id, item.data()));
}

export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  const owned = await getBusinessesByOwnerId(ownerId);
  return owned[0] ?? null;
}

export interface CreateBusinessInput {
  name: string;
  slug: string;
  whatsapp: string;
  address?: string;
  closeTime?: string;
}

export async function createOwnerBusiness(
  ownerId: string,
  input: CreateBusinessInput
): Promise<Business> {
  const reservedSlugs = new Set(['ayuda', 'admin', 'privacidad']);
  if (reservedSlugs.has(input.slug.trim().toLowerCase())) {
    throw new Error(`El link "${input.slug.trim()}" esta reservado. Elige otro para tu negocio.`);
  }
  const existing = await getBusinessBySlug(input.slug);
  if (existing) throw new Error('Ese link de catalogo ya esta en uso.');

  const db = getDb();
  const businessRef = doc(collection(db, 'businesses'));
  await setDoc(businessRef, {
    ownerId,
    name: input.name,
    slug: input.slug,
    whatsapp: toMxMobileDigits(input.whatsapp),
    address: input.address ?? null,
    deliveryFee: 0,
    minOrder: 0,
    closeTime: input.closeTime ?? '20:00',
    isOpen: true,
    plan: 'free',
    paymentMethods: [...PAYMENT_METHODS],
    clabe: null,
    createdAt: serverTimestamp(),
  });
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      setDoc(doc(db, 'businesses', businessRef.id, 'categories', category.id!), {
        name: category.name,
        order: category.order,
      })
    )
  );

  const created = await getBusinessById(businessRef.id);
  if (!created) throw new Error('No se pudo crear el negocio.');
  return created;
}

export async function updateBusinessPaymentSettings(
  businessId: string,
  input: { paymentMethods: Business['paymentMethods']; clabe: string | null }
): Promise<void> {
  await updateDoc(doc(getDb(), 'businesses', businessId), {
    paymentMethods: input.paymentMethods,
    clabe: input.clabe,
  });
}

export async function updateBusinessMinOrder(
  businessId: string,
  minOrder: number
): Promise<void> {
  if (!Number.isFinite(minOrder) || minOrder < 0) {
    throw new Error('El pedido minimo debe ser cero o mayor.');
  }
  await updateDoc(doc(getDb(), 'businesses', businessId), { minOrder });
}

/**
 * Guardamos siempre los 10 digitos nacionales: el link de WhatsApp le agrega
 * el 521 al final. Si se guarda con lada incluida el link queda invalido.
 */
export function toMxMobileDigits(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  const national =
    digits.length === 13 && digits.startsWith('521')
      ? digits.slice(3)
      : digits.length === 12 && digits.startsWith('52')
        ? digits.slice(2)
        : digits;
  if (national.length !== 10) {
    throw new Error('Escribe los 10 digitos de tu WhatsApp, sin la lada 52.');
  }
  return national;
}

/** Es el numero al que el catalogo web manda los pedidos. */
export async function updateBusinessWhatsApp(
  businessId: string,
  whatsapp: string
): Promise<void> {
  const digits = toMxMobileDigits(whatsapp);
  await updateDoc(doc(getDb(), 'businesses', businessId), { whatsapp: digits });
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

export function subscribeToCategories(
  businessId: string,
  onChange: (categories: Category[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(getDb(), 'businesses', businessId, 'categories'),
    orderBy('order', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => mapCategory(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

/** Agrega las categorías iniciales que le falten a un negocio ya existente. */
export async function ensureDefaultCategories(businessId: string): Promise<void> {
  const db = getDb();
  const existing = await getDocs(collection(db, 'businesses', businessId, 'categories'));
  const existingIds = new Set(existing.docs.map((category) => category.id));
  await Promise.all(
    DEFAULT_CATEGORIES.filter((category) => !existingIds.has(category.id!)).map((category) =>
      setDoc(doc(db, 'businesses', businessId, 'categories', category.id!), {
        name: category.name,
        order: category.order,
      })
    )
  );
}

export function newCategoryId(businessId: string): string {
  return doc(collection(getDb(), 'businesses', businessId, 'categories')).id;
}

export async function createCategory(
  businessId: string,
  categoryId: string,
  name: string,
  order: number
): Promise<void> {
  await setDoc(doc(getDb(), 'businesses', businessId, 'categories', categoryId), {
    name,
    order,
  });
}

export async function updateCategory(
  businessId: string,
  categoryId: string,
  name: string
): Promise<void> {
  await updateDoc(doc(getDb(), 'businesses', businessId, 'categories', categoryId), { name });
}

export async function deleteCategory(businessId: string, categoryId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'businesses', businessId, 'categories', categoryId));
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
