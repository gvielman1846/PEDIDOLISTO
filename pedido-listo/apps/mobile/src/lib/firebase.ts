import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { getFirebaseApp, setFirebaseAuth } from '@pedido-listo/firebase';

// getReactNativePersistence solo existe en el build de React Native de firebase/auth,
// asi que no aparece en los tipos publicos del paquete.
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  const app = getFirebaseApp();

  try {
    setFirebaseAuth(
      initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
    );
  } catch {
    // initializeAuth lanza si ya se inicializo (por ejemplo tras un fast refresh)
    setFirebaseAuth(getAuth(app));
  }

  initialized = true;
}
