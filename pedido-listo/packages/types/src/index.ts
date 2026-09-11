export type Plan = 'free' | 'pro';

export interface Business {
  id?: string;
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
  status: OrderStatus;
  createdAt?: Date;
  source: 'whatsapp';
}
