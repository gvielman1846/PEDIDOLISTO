import { getFirebaseApp } from '@pedido-listo/firebase';

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;
  getFirebaseApp();
  initialized = true;
}
