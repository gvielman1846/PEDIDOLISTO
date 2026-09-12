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
  getBusinessByOwnerId,
  createOwnerBusiness,
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
export type { CatalogData, CreateBusinessInput, CreateProductInput } from './queries';
export { createOrder, subscribeToOrders, updateOrderStatus } from './orders';
export type { CreateOrderInput } from './orders';
export {
  signInOwner,
  registerOwner,
  signInOwnerWithEmail,
  signOutOwner,
  subscribeToAuthState,
  claimBusinessOwnership,
} from './auth';
export {
  getMembership,
  writeOwnerMembership,
  listMembers,
  listInvites,
  listPendingInvitesForEmail,
  inviteStaff,
  cancelInvite,
  removeMember,
  acceptInvite,
  resolveKitchenAccess,
} from './team';
export type { KitchenAccess } from './team';
export { productImagePath, uploadProductImage } from './storage';
