import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './config';

function functionsBase(): string {
  const projectId = getFirebaseApp().options.projectId ?? 'pedidolisto-app';
  return `https://us-central1-${projectId}.cloudfunctions.net`;
}

export async function startMercadoPagoOAuth(businessId: string): Promise<string> {
  const callable = httpsCallable<{ businessId: string }, { url: string }>(
    getFunctions(getFirebaseApp(), 'us-central1'),
    'startMercadoPagoOAuth'
  );
  const result = await callable({ businessId });
  if (!result.data.url) throw new Error('No se pudo abrir Mercado Pago.');
  return result.data.url;
}

export async function disconnectMercadoPago(businessId: string): Promise<void> {
  const callable = httpsCallable<{ businessId: string }, { disconnected: boolean }>(
    getFunctions(getFirebaseApp(), 'us-central1'),
    'disconnectMercadoPago'
  );
  await callable({ businessId });
}

export async function createCardCheckout(input: {
  businessId: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  customerName: string;
  customerPhone: string;
  deliveryType: 'delivery' | 'pickup';
  address?: string;
  note?: string;
}): Promise<{ initPoint: string; orderId: string }> {
  const response = await fetch(`${functionsBase()}/createCardCheckout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { initPoint?: string; orderId?: string; error?: string };
  if (!response.ok || !data.initPoint || !data.orderId) {
    throw new Error(data.error || 'No se pudo iniciar el pago con tarjeta.');
  }
  return { initPoint: data.initPoint, orderId: data.orderId };
}
