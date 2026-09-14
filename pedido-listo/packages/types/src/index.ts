export type Plan = 'free' | 'pro';

export type StaffRole = 'owner' | 'kitchen' | 'delivery';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Dueno',
  kitchen: 'Preparador',
  delivery: 'Entrega',
};

export interface TeamMember {
  id: string;
  email: string;
  role: StaffRole;
  createdAt?: Date;
}

export interface TeamInvite {
  id: string;
  businessId: string;
  email: string;
  role: Exclude<StaffRole, 'owner'>;
  status: 'pending' | 'accepted';
  invitedBy: string;
  uid?: string;
  createdAt?: Date;
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export const PAYMENT_METHODS: PaymentMethod[] = ['efectivo', 'transferencia', 'tarjeta'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

export function enabledPaymentMethods(
  business: Pick<Business, 'paymentMethods'>
): PaymentMethod[] {
  const selected = business.paymentMethods?.filter((method) =>
    PAYMENT_METHODS.includes(method)
  );
  return selected && selected.length > 0 ? selected : [...PAYMENT_METHODS];
}

export function normalizeClabe(value: string): string {
  return value.replace(/\D/g, '').slice(0, 18);
}

export interface Business {
  id?: string;
  ownerId?: string;
  name: string;
  slug: string;
  whatsapp: string;
  logoUrl?: string;
  address?: string;
  deliveryFee: number;
  minOrder: number;
  openTime?: string;
  closeTime?: string;
  isOpen?: boolean;
  plan: Plan;
  paymentMethods?: PaymentMethod[];
  clabe?: string;
  createdAt?: Date;
}

export interface Category {
  id?: string;
  name: string;
  order: number;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  emoji?: string;
  available: boolean;
  order: number;
  createdAt?: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type DeliveryType = 'delivery' | 'pickup';

export interface CheckoutData {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  address?: string;
  note?: string;
  paymentMethod: PaymentMethod;
}

export const DEMO_BUSINESS_ID = 'demo';

export type OrderStatus = 'nuevo' | 'preparando' | 'listo' | 'entregado';

export const ORDER_STATUS_FLOW: OrderStatus[] = ['nuevo', 'preparando', 'listo', 'entregado'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
};

export interface Order {
  id?: string;
  businessId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone?: string;
  deliveryType: DeliveryType;
  address?: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  createdAt?: Date;
  source: 'whatsapp';
}
