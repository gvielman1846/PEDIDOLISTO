import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './config';

export interface PlatformStats {
  users: number;
  activeUsers: number;
  disabledUsers: number;
  businesses: number;
  orders: number;
  deliveredOrders: number;
}

export interface PlatformUser {
  uid: string;
  email: string;
  displayName: string | null;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  providers: string[];
  businesses: number;
  isAdmin: boolean;
}

export interface PlatformUsersPage {
  users: PlatformUser[];
  nextPageToken: string | null;
}

function adminCallable<Input, Output>(name: string) {
  return httpsCallable<Input, Output>(getFunctions(getFirebaseApp(), 'us-central1'), name);
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return (await adminCallable<Record<string, never>, PlatformStats>('getPlatformStats')({})).data;
}

export async function listPlatformUsers(
  pageToken?: string,
  pageSize = 50
): Promise<PlatformUsersPage> {
  return (
    await adminCallable<{ pageToken?: string; pageSize: number }, PlatformUsersPage>(
      'listPlatformUsers'
    )({ pageToken, pageSize })
  ).data;
}

export async function setPlatformUserDisabled(uid: string, disabled: boolean): Promise<void> {
  await adminCallable<{ uid: string; disabled: boolean }, { uid: string; disabled: boolean }>(
    'setPlatformUserDisabled'
  )({ uid, disabled });
}
