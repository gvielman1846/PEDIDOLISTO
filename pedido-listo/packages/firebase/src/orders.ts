import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import type { CartItem, CheckoutData, Order, OrderStatus } from '@pedido-listo/types';
import { getDb } from './config';

function mapOrder(id: string, data: DocumentData): Order {
  return {
    id,
    businessId: data.businessId,
    items: data.items ?? [],
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee ?? 0,
    total: data.total,
    customerName: data.customerName,
    deliveryType: data.deliveryType,
    address: data.address,
    note: data.note,
    status: data.status ?? 'nuevo',
    source: data.source ?? 'whatsapp',
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
  };
}

export interface CreateOrderInput {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  checkout: CheckoutData;
}

export async function createOrder(businessId: string, input: CreateOrderInput): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, 'businesses', businessId, 'orders'), {
    businessId,
    items: input.items,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
    customerName: input.checkout.customerName,
    deliveryType: input.checkout.deliveryType,
    address: input.checkout.address ?? null,
    note: input.checkout.note ?? null,
    status: 'nuevo',
    source: 'whatsapp',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToOrders(
  businessId: string,
  onChange: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, 'businesses', businessId, 'orders'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => mapOrder(d.id, d.data()));
      onChange(orders);
    },
    (err) => onError?.(err)
  );
}

export async function updateOrderStatus(
  businessId: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, 'businesses', businessId, 'orders', orderId), { status });
}
