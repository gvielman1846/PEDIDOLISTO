import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './config';
import { reauthenticateAccount } from './auth';

export async function deleteOwnerAccount(password: string): Promise<number> {
  if (!password) throw new Error('Escribe tu contraseña actual.');

  await reauthenticateAccount(password);
  const callable = httpsCallable<
    Record<string, never>,
    { deleted: boolean; businessesDeleted: number }
  >(getFunctions(getFirebaseApp(), 'us-central1'), 'deleteOwnerAccount');
  const result = await callable({});
  return result.data.businessesDeleted;
}
