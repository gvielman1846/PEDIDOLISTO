import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
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

export async function registerOwner(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;

  if (current?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email.trim(), password);
    const result = await linkWithCredential(current, credential);
    return result.user;
  }

  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function signInOwnerWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return result.user;
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
