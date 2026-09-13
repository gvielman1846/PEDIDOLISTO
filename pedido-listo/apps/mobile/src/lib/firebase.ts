import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFirebaseApp, setFirebaseAuth, setFirebaseDb } from '@pedido-listo/firebase';

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

  // El transporte normal (WebChannel) truena en estos telefonos: los logs
  // muestran "RPC 'Write' stream transport errored" y las escrituras nunca se
  // confirman. Con long polling cada respuesta se cierra enseguida y pasa.
  setFirebaseDb(initializeFirestore(app, { experimentalForceLongPolling: true }));

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
