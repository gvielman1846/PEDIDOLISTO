import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';

export function productImagePath(businessId: string, productId: string, ext = 'jpg'): string {
  return `businesses/${businessId}/products/${productId}.${ext}`;
}

function extFromContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/svg+xml') return 'svg';
  return 'jpg';
}

export async function uploadProductImage(
  businessId: string,
  productId: string,
  data: Blob | Uint8Array | ArrayBuffer,
  contentType = 'image/jpeg'
): Promise<string> {
  const storage = getFirebaseStorage();
  const path = productImagePath(businessId, productId, extFromContentType(contentType));
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, data, { contentType });
  return getDownloadURL(fileRef);
}
