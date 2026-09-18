import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

const REGION = 'us-central1';
const ADMIN_EMAIL = 'giovanni.vielman@gmail.com';
const MAX_PAGE_SIZE = 100;

function requireAdmin(request: CallableRequest<unknown>): DecodedIdToken {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
  if (String(token.email ?? '').toLowerCase() !== ADMIN_EMAIL) {
    throw new HttpsError('permission-denied', 'Esta cuenta no tiene acceso administrativo.');
  }
  return token;
}

async function countAuthUsers(): Promise<{ total: number; disabled: number }> {
  let total = 0;
  let disabled = 0;
  let pageToken: string | undefined;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    total += page.users.length;
    disabled += page.users.filter((user) => user.disabled).length;
    pageToken = page.pageToken;
  } while (pageToken);
  return { total, disabled };
}

export const getPlatformStats = onCall({ region: REGION }, async (request) => {
  requireAdmin(request);
  const db = getFirestore();
  const [users, businesses, orders, delivered] = await Promise.all([
    countAuthUsers(),
    db.collection('businesses').count().get(),
    db.collectionGroup('orders').count().get(),
    db.collectionGroup('orders').where('status', '==', 'entregado').count().get(),
  ]);

  return {
    users: users.total,
    activeUsers: users.total - users.disabled,
    disabledUsers: users.disabled,
    businesses: businesses.data().count,
    orders: orders.data().count,
    deliveredOrders: delivered.data().count,
  };
});

interface ListUsersInput {
  pageToken?: string;
  pageSize?: number;
}

export const listPlatformUsers = onCall<ListUsersInput>({ region: REGION }, async (request) => {
  requireAdmin(request);
  const pageSize = Math.min(Math.max(Number(request.data?.pageSize) || 50, 1), MAX_PAGE_SIZE);
  const page = await getAuth().listUsers(pageSize, request.data?.pageToken || undefined);
  const db = getFirestore();
  const businessCounts = new Map<string, number>();

  for (let start = 0; start < page.users.length; start += 30) {
    const uids = page.users.slice(start, start + 30).map((user) => user.uid);
    if (!uids.length) continue;
    const businesses = await db.collection('businesses').where('ownerId', 'in', uids).get();
    for (const business of businesses.docs) {
      const ownerId = String(business.data().ownerId ?? '');
      businessCounts.set(ownerId, (businessCounts.get(ownerId) ?? 0) + 1);
    }
  }

  return {
    users: page.users.map((user) => ({
      uid: user.uid,
      email: user.email ?? 'Sin correo',
      displayName: user.displayName ?? null,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime ?? null,
      lastSignInAt: user.metadata.lastSignInTime ?? null,
      providers: user.providerData.map((provider) => provider.providerId),
      businesses: businessCounts.get(user.uid) ?? 0,
      isAdmin: user.email?.toLowerCase() === ADMIN_EMAIL,
    })),
    nextPageToken: page.pageToken ?? null,
  };
});

interface SetDisabledInput {
  uid?: string;
  disabled?: boolean;
}

export const setPlatformUserDisabled = onCall<SetDisabledInput>({ region: REGION }, async (request) => {
  const admin = requireAdmin(request);
  const uid = String(request.data?.uid ?? '').trim();
  const disabled = request.data?.disabled;
  if (!uid || typeof disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Usuario o estado inválido.');
  }
  if (uid === request.auth?.uid) {
    throw new HttpsError('failed-precondition', 'No puedes deshabilitar tu propia cuenta.');
  }

  const target = await getAuth().getUser(uid);
  if (target.email?.toLowerCase() === ADMIN_EMAIL) {
    throw new HttpsError('failed-precondition', 'La cuenta administradora no se puede deshabilitar.');
  }

  await getAuth().updateUser(uid, { disabled });
  if (disabled) await getAuth().revokeRefreshTokens(uid);
  await getFirestore().collection('adminAudit').add({
    action: disabled ? 'user_disabled' : 'user_enabled',
    targetUid: uid,
    targetEmail: target.email ?? null,
    adminUid: request.auth?.uid,
    adminEmail: admin.email ?? ADMIN_EMAIL,
    createdAt: new Date(),
  });
  return { uid, disabled };
});
