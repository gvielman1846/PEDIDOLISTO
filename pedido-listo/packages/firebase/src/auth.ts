import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from './config';

export async function signInOwner(): Promise<string> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser.uid;

  const result = await signInAnonymously(auth);
  return result.user.uid;
}

export function subscribeToAuthState(onChange: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), onChange);
}

export async function registerOwner(email: string, password?: string): Promise<User> {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  const secret = password && password.length >= 8 ? password : randomPassword();

  if (current?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email.trim(), secret);
    const result = await linkWithCredential(current, credential);
    return result.user;
  }

  const result = await createUserWithEmailAndPassword(auth, email.trim(), secret);
  return result.user;
}

export async function signInOwnerWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return result.user;
}

export async function sendPasswordSetupEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function reauthenticateAccount(password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error('No autenticado');
  const credential = EmailAuthProvider.credential(user.email, password);
  const result = await reauthenticateWithCredential(user, credential);
  return result.user;
}

export async function changeAccountEmail(newEmail: string, currentPassword: string): Promise<void> {
  const user = await reauthenticateAccount(currentPassword);
  await verifyBeforeUpdateEmail(user, newEmail.trim());
}

export async function changeAccountPassword(currentPassword: string, nextPassword: string): Promise<void> {
  if (nextPassword.trim().length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }
  const user = await reauthenticateAccount(currentPassword);
  await updatePassword(user, nextPassword);
}

function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(24);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

export async function signOutOwner(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function claimBusinessOwnership(businessId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No autenticado');

  const db = getDb();
  const ref = doc(db, 'businesses', businessId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('Negocio no encontrado');

  const ownerId = snap.data().ownerId;
  if (ownerId && ownerId !== uid) {
    throw new Error('Este negocio ya tiene dueno');
  }

  if (!ownerId) {
    await updateDoc(ref, { ownerId: uid });
  }
}
