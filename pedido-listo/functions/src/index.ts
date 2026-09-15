import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const REGION = 'us-central1';
const MAX_AUTH_AGE_SECONDS = 5 * 60;

async function deleteRefs(refs: DocumentReference[]): Promise<void> {
  const db = getFirestore();
  for (let start = 0; start < refs.length; start += 400) {
    const batch = db.batch();
    for (const ref of refs.slice(start, start + 400)) batch.delete(ref);
    await batch.commit();
  }
}

/**
 * Borra de forma administrativa la cuenta del dueño y todos sus negocios.
 * La función es idempotente: cada paso se puede repetir si un intento se corta.
 */
export {
  startMercadoPagoOAuth,
  disconnectMercadoPago,
  mercadoPagoOAuthCallback,
  createCardCheckout,
  mercadoPagoWebhook,
} from './mercadoPago';

export const deleteOwnerAccount = onCall(
  { region: REGION, timeoutSeconds: 540, memory: '512MiB' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión otra vez.');

    const authTime = Number(request.auth?.token.auth_time ?? 0);
    if (!authTime || Date.now() / 1000 - authTime > MAX_AUTH_AGE_SECONDS) {
      throw new HttpsError(
        'failed-precondition',
        'Por seguridad, confirma de nuevo tu contraseña.'
      );
    }

    const db = getFirestore();
    const bucket = getStorage().bucket();
    const owned = await db.collection('businesses').where('ownerId', '==', uid).get();

    for (const business of owned.docs) {
      const businessId = business.id;

      // Detiene pedidos nuevos antes de comenzar el borrado recursivo.
      await business.ref.set(
        { isOpen: false, deletingAt: new Date(), deletingBy: uid },
        { merge: true }
      );

      const [invites, members] = await Promise.all([
        db.collection('invites').where('businessId', '==', businessId).get(),
        business.ref.collection('members').get(),
      ]);
      await deleteRefs(invites.docs.map((item) => item.ref));

      // Borra la membresía activa del personal solo si apunta a este negocio.
      for (const member of members.docs) {
        if (member.id === uid) continue;
        const membershipRef = db.collection('memberships').doc(member.id);
        const membership = await membershipRef.get();
        if (membership.data()?.businessId === businessId) {
          await membershipRef.delete();
        }
      }

      // Las fotos deben borrarse antes que el documento del negocio.
      await bucket.deleteFiles({ prefix: `businesses/${businessId}/`, force: true });
      await db.recursiveDelete(business.ref);
    }

    // Si el dueño también pertenecía a un negocio ajeno, sale de ese equipo.
    const foreignMemberships = await db
      .collectionGroup('members')
      .where('uid', '==', uid)
      .get();
    await deleteRefs(foreignMemberships.docs.map((item) => item.ref));

    await Promise.all([
      db.collection('memberships').doc(uid).delete(),
      db.collection('userProfiles').doc(uid).delete(),
    ]);

    // Auth se elimina al final para conservar autorización durante todo el proceso.
    await getAuth().deleteUser(uid);
    return { deleted: true, businessesDeleted: owned.size };
  }
);
