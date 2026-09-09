export {
  getFirebaseApp,
  getDb,
  getFirebaseAuth,
  getFirebaseStorage,
  isFirebaseConfigured,
} from './config';
export {
  getBusinessBySlug,
  getBusinessById,
  getCategories,
  getProducts,
  loadCatalogBySlug,
} from './queries';
export type { CatalogData } from './queries';
export { createOrder, subscribeToOrders, updateOrderStatus } from './orders';
export type { CreateOrderInput } from './orders';
export { signInOwner, claimBusinessOwnership } from './auth';
export { productImagePath, uploadProductImage } from './storage';
