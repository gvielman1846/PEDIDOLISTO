import {
  addDoc,
  collection,
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
import { getBusinessById, getBusinessByOwnerId } from './queries';
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
  await setDoc(doc(db, 'memberships', uid), {
    businessId,
    role: 'owner',
    email: normalizeEmail(email),
  });
  await setDoc(doc(db, 'businesses', businessId, 'members', uid), {
    role: 'owner',
    email: normalizeEmail(email),
    businessId,
    createdAt: serverTimestamp(),
  });
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
    businessId: invite.businessId,
    role: invite.role,
    email: normalized,
    inviteId: invite.id,
  });
  await setDoc(doc(db, 'businesses', invite.businessId, 'members', uid), {
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
      if (business) return { business, role: membership.role };
    }
  } catch (err) {
    onIssue?.(issueOf('tu membresia', err));
  }

  try {
    const owned = await getBusinessByOwnerId(uid);
    if (owned?.id) {
      if (email) {
        try {
          await writeOwnerMembership(owned.id, uid, email);
        } catch {
          // el dueno igual puede entrar si el backfill falla
        }
      }
      return { business: owned, role: 'owner' };
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
