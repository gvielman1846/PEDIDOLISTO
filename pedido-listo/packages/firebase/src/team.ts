import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import type { Business, StaffRole, TeamInvite, TeamMember } from '@pedido-listo/types';
import { getFirebaseAuth } from './config';
import { getBusinessById, getBusinessesByOwnerId } from './queries';
import { getDb } from './config';

export interface KitchenAccess {
  business: Business;
  role: StaffRole;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapInvite(id: string, data: DocumentData): TeamInvite {
  return {
    id,
    businessId: data.businessId,
    email: data.email,
    role: data.role,
    status: data.status,
    invitedBy: data.invitedBy,
    uid: data.uid,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
  };
}

function mapMember(id: string, data: DocumentData): TeamMember {
  return {
    id,
    email: data.email ?? '',
    role: data.role,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
  };
}

export async function getMembership(uid: string): Promise<{ businessId: string; role: StaffRole } | null> {
  const snap = await getDoc(doc(getDb(), 'memberships', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { businessId: data.businessId, role: data.role };
}

export async function writeOwnerMembership(businessId: string, uid: string, email: string): Promise<void> {
  const db = getDb();
  const normalized = normalizeEmail(email);
  await setDoc(doc(db, 'memberships', uid), {
    uid,
    businessId,
    role: 'owner',
    email: normalized,
  });
  await setDoc(doc(db, 'businesses', businessId, 'members', uid), {
    uid,
    role: 'owner',
    email: normalized,
    businessId,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, 'userProfiles', uid),
    { email: normalized, activeBusinessId: businessId },
    { merge: true }
  );
}

export async function listMembers(businessId: string): Promise<TeamMember[]> {
  const snap = await getDocs(collection(getDb(), 'businesses', businessId, 'members'));
  return snap.docs.map((d) => mapMember(d.id, d.data()));
}

export async function listInvites(businessId: string): Promise<TeamInvite[]> {
  const q = query(
    collection(getDb(), 'invites'),
    where('businessId', '==', businessId),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapInvite(d.id, d.data()));
}

export async function listPendingInvitesForEmail(email: string): Promise<TeamInvite[]> {
  const q = query(
    collection(getDb(), 'invites'),
    where('email', '==', normalizeEmail(email)),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapInvite(d.id, d.data()));
}

export async function inviteStaff(
  businessId: string,
  email: string,
  role: Exclude<StaffRole, 'owner'>
): Promise<void> {
  const auth = getFirebaseAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No autenticado');

  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) throw new Error('Escribe un correo valido.');

  const existing = await listInvites(businessId);
  if (existing.some((invite) => invite.email === normalized)) {
    throw new Error('Ese correo ya tiene una invitacion pendiente.');
  }

  await addDoc(collection(getDb(), 'invites'), {
    businessId,
    email: normalized,
    role,
    status: 'pending',
    invitedBy: uid,
    createdAt: serverTimestamp(),
  });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'invites', inviteId));
}

export async function removeMember(businessId: string, memberId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'businesses', businessId, 'members', memberId));
  await deleteDoc(doc(db, 'memberships', memberId));
}

export async function acceptInvite(invite: TeamInvite, uid: string, email: string): Promise<KitchenAccess> {
  const db = getDb();
  const normalized = normalizeEmail(email);

  await setDoc(doc(db, 'memberships', uid), {
    uid,
    businessId: invite.businessId,
    role: invite.role,
    email: normalized,
    inviteId: invite.id,
  });
  await setDoc(doc(db, 'businesses', invite.businessId, 'members', uid), {
    uid,
    role: invite.role,
    email: normalized,
    inviteId: invite.id,
    businessId: invite.businessId,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'invites', invite.id), {
    status: 'accepted',
    uid,
  });

  const business = await getBusinessById(invite.businessId);
  if (!business) throw new Error('El negocio de la invitacion ya no existe.');
  return { business, role: invite.role };
}

export async function getUserProfile(uid: string): Promise<{ phone: string; activeBusinessId?: string } | null> {
  const snap = await getDoc(doc(getDb(), 'userProfiles', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { phone: data.phone ?? '', activeBusinessId: data.activeBusinessId };
}

export async function saveUserPhone(uid: string, phone: string): Promise<void> {
  await setDoc(
    doc(getDb(), 'userProfiles', uid),
    { phone: phone.trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function listUserKitchens(uid: string): Promise<KitchenAccess[]> {
  const byId = new Map<string, KitchenAccess>();

  try {
    const owned = await getBusinessesByOwnerId(uid);
    for (const business of owned) {
      if (business.id) byId.set(business.id, { business, role: 'owner' });
    }
  } catch {
    // reglas o red: seguimos con membresia
  }

  try {
    const snap = await getDocs(query(collectionGroup(getDb(), 'members'), where('uid', '==', uid)));
    for (const item of snap.docs) {
      const businessId = (item.data().businessId as string | undefined) ?? item.ref.parent.parent?.id;
      if (!businessId || byId.has(businessId)) continue;
      const business = await getBusinessById(businessId);
      if (business) {
        const role =
          business.ownerId === uid ? 'owner' : ((item.data().role as StaffRole) ?? 'kitchen');
        byId.set(businessId, { business, role });
      }
    }
  } catch {
    // indice de collection group todavia no publicado
  }

  try {
    const membership = await getMembership(uid);
    if (membership) {
      const business = await getBusinessById(membership.businessId);
      if (business) {
        const role = business.ownerId === uid ? 'owner' : membership.role;
        byId.set(membership.businessId, { business, role });
      }
    }
  } catch {
    // sin membresia activa
  }

  return [...byId.values()].sort((a, b) => a.business.name.localeCompare(b.business.name, 'es'));
}

export async function setActiveKitchen(
  uid: string,
  email: string,
  access: KitchenAccess
): Promise<void> {
  if (!access.business.id) throw new Error('Negocio invalido');
  const db = getDb();
  const normalized = normalizeEmail(email);
  await setDoc(doc(db, 'memberships', uid), {
    uid,
    businessId: access.business.id,
    role: access.role,
    email: normalized,
  });
  await setDoc(
    doc(db, 'userProfiles', uid),
    { email: normalized, activeBusinessId: access.business.id },
    { merge: true }
  );
}

function issueOf(step: string, err: unknown): string {
  const code = (err as { code?: string })?.code;
  const detail = code ?? (err instanceof Error ? err.message : 'error desconocido');
  return `No se pudo revisar ${step}: ${detail}`;
}

/**
 * Busca el negocio del usuario. Cada paso es una consulta opcional: si una falla
 * (reglas sin publicar, indice faltante) seguimos buscando en vez de bloquear al
 * dueno que apenas va a crear su cocina.
 */
export async function resolveKitchenAccess(
  uid: string,
  email?: string | null,
  onIssue?: (message: string) => void
): Promise<KitchenAccess | null> {
  try {
    const membership = await getMembership(uid);
    if (membership) {
      const business = await getBusinessById(membership.businessId);
      if (business) {
        const role = business.ownerId === uid ? 'owner' : membership.role;
        return { business, role };
      }
    }
  } catch (err) {
    onIssue?.(issueOf('tu membresia', err));
  }

  try {
    const owned = await getBusinessesByOwnerId(uid);
    if (owned[0]?.id) {
      if (email) {
        try {
          await writeOwnerMembership(owned[0].id, uid, email);
        } catch {
          // el dueno igual puede entrar si el backfill falla
        }
      }
      return { business: owned[0], role: 'owner' };
    }
  } catch (err) {
    onIssue?.(issueOf('tus negocios', err));
  }

  if (email) {
    try {
      const pending = await listPendingInvitesForEmail(email);
      if (pending[0]) return acceptInvite(pending[0], uid, email);
    } catch (err) {
      onIssue?.(issueOf('tus invitaciones', err));
    }
  }

  return null;
}
