export {
  getFirebaseApp,
  getDb,
  getFirebaseAuth,
  setFirebaseAuth,
  getFirebaseStorage,
  isFirebaseConfigured,
} from './config';
export {
  getBusinessBySlug,
  getBusinessById,
  getCategories,
  getProducts,
  subscribeToProducts,
  newProductId,
  createProduct,
  updateProduct,
  updateProductAvailability,
  deleteProduct,
  loadCatalogBySlug,
} from './queries';
export type { CatalogData, CreateProductInput } from './queries';
export { createOrder, subscribeToOrders, updateOrderStatus } from './orders';
export type { CreateOrderInput } from './orders';
export { signInOwner, claimBusinessOwnership } from './auth';
export { productImagePath, uploadProductImage } from './storage';
