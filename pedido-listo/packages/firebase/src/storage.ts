import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';

export function productImagePath(businessId: string, productId: string, ext = 'jpg'): string {
  return `businesses/${businessId}/products/${productId}.${ext}`;
}

export async function uploadProductImage(
  businessId: string,
  productId: string,
  data: Uint8Array | ArrayBuffer,
  contentType = 'image/jpeg'
): Promise<string> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, productImagePath(businessId, productId));
  await uploadBytes(fileRef, data, { contentType });
  return getDownloadURL(fileRef);
}
