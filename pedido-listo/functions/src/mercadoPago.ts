import { randomUUID } from 'crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';

const REGION = 'us-central1';
const MP_AUTH = 'https://auth.mercadopago.com.mx/authorization';
const MP_API = 'https://api.mercadopago.com';

function env(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

function catalogBaseUrl(): string {
  return env('CATALOG_BASE_URL', 'https://pedidolisto-jet.vercel.app').replace(/\/$/, '');
}

type CheckoutItem = { productId: string; name: string; price: number; quantity: number };

function mpCredentials(): { clientId: string; clientSecret: string } {
  const clientId = env('MERCADOPAGO_CLIENT_ID');
  const clientSecret = env('MERCADOPAGO_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new HttpsError(
      'failed-precondition',
      'Falta configurar Mercado Pago en el servidor.'
    );
  }
  return { clientId, clientSecret };
}

function projectId(): string {
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'pedidolisto-app';
}

function oauthRedirectUri(): string {
  return `https://us-central1-${projectId()}.cloudfunctions.net/mercadoPagoOAuthCallback`;
}

function webhookUrl(): string {
  return `https://us-central1-${projectId()}.cloudfunctions.net/mercadoPagoWebhook`;
}

function htmlPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: sans-serif; background: #fff7ed; color: #1c1917; margin: 0; padding: 32px 20px; }
      .card { max-width: 420px; margin: 0 auto; background: white; border-radius: 18px; padding: 24px; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      p { color: #57534e; line-height: 1.45; }
    </style>
  </head>
  <body><div class="card">${body}</div></body>
</html>`;
}

async function mpJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init);
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : `Mercado Pago ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function exchangeToken(body: Record<string, string>): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = mpCredentials();
  const data = await mpJson(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      ...body,
    }),
  });
  const accessToken = String(data.access_token ?? '');
  const refreshToken = String(data.refresh_token ?? '');
  const userId = String(data.user_id ?? '');
  const expiresIn = Number(data.expires_in ?? 0);
  if (!accessToken) throw new Error('Mercado Pago no devolvio un token.');
  return { accessToken, refreshToken, userId, expiresIn };
}

async function sellerAccessToken(businessId: string): Promise<string> {
  const db = getFirestore();
  const ref = db.collection('mercadoPagoTokens').doc(businessId);
  const snap = await ref.get();
  const data = snap.data();
  if (!data?.accessToken) {
    throw new HttpsError('failed-precondition', 'Este negocio no tiene Mercado Pago conectado.');
  }

  const expiresAt = Number(data.expiresAt ?? 0);
  if (expiresAt && Date.now() < expiresAt - 60_000) {
    return String(data.accessToken);
  }
  if (!data.refreshToken) return String(data.accessToken);

  const tokens = await exchangeToken({
    grant_type: 'refresh_token',
    refresh_token: String(data.refreshToken),
  });
  await ref.set(
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || data.refreshToken,
      userId: tokens.userId || data.userId,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return tokens.accessToken;
}

function cors(req: { method?: string; headers: { origin?: string } }, res: {
  set: (field: string, value: string) => void;
  status: (code: number) => { send: (body?: string) => void };
}): boolean {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return true;
  }
  return false;
}

export const startMercadoPagoOAuth = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesion otra vez.');
  const businessId = String(request.data?.businessId ?? '');
  if (!businessId) throw new HttpsError('invalid-argument', 'Falta el negocio.');

  const db = getFirestore();
  const business = await db.collection('businesses').doc(businessId).get();
  if (!business.exists) throw new HttpsError('not-found', 'No encontramos ese negocio.');
  if (business.data()?.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'Solo el dueno puede conectar Mercado Pago.');
  }

  const { clientId } = mpCredentials();
  const state = randomUUID();
  await db.collection('mpOAuthStates').doc(state).set({
    businessId,
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  const url = new URL(MP_AUTH);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', oauthRedirectUri());
  return { url: url.toString() };
});

export const disconnectMercadoPago = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesion otra vez.');
  const businessId = String(request.data?.businessId ?? '');
  if (!businessId) throw new HttpsError('invalid-argument', 'Falta el negocio.');

  const db = getFirestore();
  const businessRef = db.collection('businesses').doc(businessId);
  const business = await businessRef.get();
  if (!business.exists) throw new HttpsError('not-found', 'No encontramos ese negocio.');
  if (business.data()?.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'Solo el dueno puede desconectar Mercado Pago.');
  }

  const methods = Array.isArray(business.data()?.paymentMethods)
    ? (business.data()?.paymentMethods as string[]).filter((method) => method !== 'tarjeta')
    : ['efectivo', 'transferencia'];

  await Promise.all([
    db.collection('mercadoPagoTokens').doc(businessId).delete(),
    businessRef.set(
      {
        mercadoPagoConnected: false,
        mercadoPagoUserId: FieldValue.delete(),
        mercadoPagoNickname: FieldValue.delete(),
        paymentMethods: methods.length > 0 ? methods : ['efectivo'],
      },
      { merge: true }
    ),
  ]);
  return { disconnected: true };
});

export const mercadoPagoOAuthCallback = onRequest({ region: REGION, invoker: 'public' }, async (req, res) => {
  try {
    const error = String(req.query.error ?? '');
    if (error) {
      res.status(400).send(htmlPage('No se conecto', `<h1>No se conecto Mercado Pago</h1><p>${error}</p>`));
      return;
    }

    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    if (!code || !state) {
      res.status(400).send(htmlPage('Faltan datos', '<h1>Faltan datos</h1><p>Vuelve a intentar desde la app.</p>'));
      return;
    }

    const db = getFirestore();
    const stateRef = db.collection('mpOAuthStates').doc(state);
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) {
      res.status(400).send(htmlPage('Link vencido', '<h1>Este link ya no sirve</h1><p>Vuelve a conectar Mercado Pago desde la app.</p>'));
      return;
    }
    const businessId = String(stateSnap.data()?.businessId ?? '');
    await stateRef.delete();

    const tokens = await exchangeToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthRedirectUri(),
    });

    const me = await mpJson(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const nickname = String(me.nickname ?? me.email ?? tokens.userId);

    const businessRef = db.collection('businesses').doc(businessId);
    const business = await businessRef.get();
    const currentMethods = Array.isArray(business.data()?.paymentMethods)
      ? (business.data()?.paymentMethods as string[])
      : ['efectivo', 'transferencia', 'tarjeta'];
    const paymentMethods = currentMethods.includes('tarjeta')
      ? currentMethods
      : [...currentMethods, 'tarjeta'];

    await db.collection('mercadoPagoTokens').doc(businessId).set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: tokens.userId,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await businessRef.set(
      {
        mercadoPagoConnected: true,
        mercadoPagoUserId: tokens.userId,
        mercadoPagoNickname: nickname,
        paymentMethods,
      },
      { merge: true }
    );

    res.status(200).send(
      htmlPage(
        'Mercado Pago listo',
        '<h1>Mercado Pago conectado</h1><p>Ya puedes volver a PedidoListo. El dinero de las tarjetas caera en esta cuenta.</p>'
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo conectar Mercado Pago.';
    res.status(500).send(htmlPage('Error', `<h1>No se pudo conectar</h1><p>${message}</p>`));
  }
});

export const createCardCheckout = onRequest({ region: REGION, invoker: 'public', cors: true }, async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Usa POST.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const businessId = String(body.businessId ?? '');
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];
    const customerName = String(body.customerName ?? '').trim();
    const customerPhone = String(body.customerPhone ?? '').replace(/\D/g, '');
    const deliveryType = body.deliveryType === 'pickup' ? 'pickup' : 'delivery';
    const address = String(body.address ?? '').trim();
    const note = String(body.note ?? '').trim();

    if (!businessId) throw new Error('Falta el negocio.');
    if (!customerName) throw new Error('Escribe tu nombre.');
    if (customerPhone.length < 10) throw new Error('Escribe tu celular a 10 digitos.');
    if (deliveryType === 'delivery' && !address) throw new Error('Escribe tu direccion.');
    if (items.length === 0) throw new Error('El carrito esta vacio.');

    const db = getFirestore();
    const businessRef = db.collection('businesses').doc(businessId);
    const businessSnap = await businessRef.get();
    if (!businessSnap.exists) throw new Error('Negocio no encontrado.');
    const business = businessSnap.data() ?? {};
    if (business.deletingAt) throw new Error('Este negocio ya no recibe pedidos.');
    if (!business.mercadoPagoConnected) {
      throw new Error('Este negocio todavia no recibe pagos con tarjeta.');
    }

    const productSnaps = await businessRef.collection('products').get();
    const products = new Map(productSnaps.docs.map((doc) => [doc.id, doc.data()]));
    const pricedItems = items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new Error(`Ya no esta disponible: ${item.name}`);
      if (product.available === false) throw new Error(`${product.name} se agoto.`);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) throw new Error('Hay un producto con precio invalido.');
      return {
        productId: item.productId,
        name: String(product.name ?? item.name),
        price,
        quantity,
      };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = deliveryType === 'delivery' ? Number(business.deliveryFee ?? 0) : 0;
    const total = subtotal + deliveryFee;
    const minOrder = Number(business.minOrder ?? 0);
    if (subtotal < minOrder) {
      throw new Error(`Pedido minimo: $${minOrder.toFixed(2)}`);
    }

    const slug = String(business.slug ?? '');
    const catalogReturn = `${catalogBaseUrl()}/${slug}`;
    const orderRef = businessRef.collection('orders').doc();
    await orderRef.set({
      businessId,
      items: pricedItems,
      subtotal,
      deliveryFee,
      total,
      customerName,
      customerPhone,
      deliveryType,
      address: address || null,
      note: note || null,
      paymentMethod: 'tarjeta',
      paymentStatus: 'pending',
      status: 'nuevo',
      source: 'catalog',
      createdAt: FieldValue.serverTimestamp(),
    });

    const token = await sellerAccessToken(businessId);
    const preference = await mpJson(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          ...pricedItems.map((item) => ({
            title: item.name.slice(0, 120),
            quantity: item.quantity,
            currency_id: 'MXN',
            unit_price: item.price,
          })),
          ...(deliveryFee > 0
            ? [{ title: 'Envio', quantity: 1, currency_id: 'MXN', unit_price: deliveryFee }]
            : []),
        ],
        payer: {
          name: customerName,
          phone: { number: customerPhone },
        },
        external_reference: `${businessId}:${orderRef.id}`,
        metadata: { businessId, orderId: orderRef.id },
        notification_url: webhookUrl(),
        back_urls: {
          success: `${catalogReturn}?pago=ok&pedido=${orderRef.id}`,
          failure: `${catalogReturn}?pago=error&pedido=${orderRef.id}`,
          pending: `${catalogReturn}?pago=pendiente&pedido=${orderRef.id}`,
        },
        auto_return: 'approved',
        statement_descriptor: String(business.name ?? 'PedidoListo').slice(0, 22),
      }),
    });

    const initPoint = String(preference.init_point ?? preference.sandbox_init_point ?? '');
    if (!initPoint) throw new Error('Mercado Pago no devolvio el checkout.');
    if (preference.id) {
      await Promise.all([
        orderRef.set({ mpPreferenceId: preference.id }, { merge: true }),
        db.collection('mpCheckouts').doc(String(preference.id)).set({
          businessId,
          orderId: orderRef.id,
          createdAt: FieldValue.serverTimestamp(),
        }),
      ]);
    }

    res.status(200).json({ initPoint, orderId: orderRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el pago.';
    res.status(400).json({ error: message });
  }
});

async function markOrderFromPayment(paymentId: string): Promise<void> {
  const db = getFirestore();
  const tokens = await db.collection('mercadoPagoTokens').get();
  for (const tokenDoc of tokens.docs) {
    try {
      const token = await sellerAccessToken(tokenDoc.id);
      const payment = await mpJson(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const metadata = (payment.metadata ?? {}) as Record<string, string>;
      const external = String(payment.external_reference ?? '');
      const [businessIdFromRef, orderIdFromRef] = external.split(':');
      const businessId = metadata.businessId || businessIdFromRef || tokenDoc.id;
      const orderId = metadata.orderId || orderIdFromRef;
      if (!orderId) continue;

      const status = String(payment.status ?? '');
      const paymentStatus = status === 'approved' ? 'paid' : status === 'rejected' ? 'failed' : 'pending';
      await db.collection('businesses').doc(businessId).collection('orders').doc(orderId).set(
        {
          paymentStatus,
          mpPaymentId: paymentId,
          paidAt: paymentStatus === 'paid' ? FieldValue.serverTimestamp() : null,
        },
        { merge: true }
      );
      return;
    } catch {
      // El pago no pertenece a esta cuenta; prueba la siguiente.
    }
  }
}

export const mercadoPagoWebhook = onRequest({ region: REGION, invoker: 'public' }, async (req, res) => {
  try {
    const queryId = String(req.query.id ?? req.query['data.id'] ?? '');
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
    const paymentId = String(body?.data?.id ?? queryId);
    const type = String(body?.type ?? req.query.topic ?? req.query.type ?? '');
    if (paymentId && (type === 'payment' || req.query.topic === 'payment' || body?.action?.includes?.('payment'))) {
      await markOrderFromPayment(paymentId);
    }
    res.status(200).send('ok');
  } catch (error) {
    console.error(error);
    res.status(200).send('ok');
  }
});
