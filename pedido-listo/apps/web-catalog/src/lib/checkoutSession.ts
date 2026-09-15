import type { CartItem, CheckoutData } from '@pedido-listo/types';

const KEY = 'pedidolisto.pendingCheckout';

export interface StoredCheckout {
  checkout: CheckoutData;
  items: CartItem[];
}

export function savePendingCheckout(value: StoredCheckout): void {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function readPendingCheckout(): StoredCheckout | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCheckout;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export function clearPendingCheckout(): void {
  sessionStorage.removeItem(KEY);
}

export function paymentReturnFromUrl(): 'ok' | 'error' | 'pendiente' | null {
  const value = new URLSearchParams(window.location.search).get('pago');
  if (value === 'ok' || value === 'error' || value === 'pendiente') return value;
  return null;
}

export function clearPaymentQuery(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('pago') && !url.searchParams.has('pedido')) return;
  url.searchParams.delete('pago');
  url.searchParams.delete('pedido');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}
