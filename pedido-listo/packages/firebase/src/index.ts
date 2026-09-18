export {
  getFirebaseApp,
  getDb,
  setFirebaseDb,
  getFirebaseAuth,
  setFirebaseAuth,
  getFirebaseStorage,
  isFirebaseConfigured,
} from './config';
export {
  getBusinessBySlug,
  getBusinessById,
  getBusinessByOwnerId,
  getBusinessesByOwnerId,
  createOwnerBusiness,
  updateBusinessPaymentSettings,
  updateBusinessMinOrder,
  updateBusinessWhatsApp,
  toMxMobileDigits,
  getCategories,
  subscribeToCategories,
  ensureDefaultCategories,
  newCategoryId,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  subscribeToProducts,
  newProductId,
  createProduct,
  updateProduct,
  updateProductAvailability,
  deleteProduct,
  loadCatalogBySlug,
} from './queries';
export { DEFAULT_CATEGORIES } from './queries';
export type { CatalogData, CreateBusinessInput, CreateProductInput } from './queries';
export { createOrder, subscribeToOrders, updateOrderStatus } from './orders';
export type { CreateOrderInput } from './orders';
export {
  signInOwner,
  registerOwner,
  signInOwnerWithEmail,
  sendPasswordSetupEmail,
  changeAccountEmail,
  changeAccountPassword,
  signOutOwner,
  subscribeToAuthState,
  claimBusinessOwnership,
} from './auth';
export { deleteOwnerAccount } from './account';
export {
  getPlatformStats,
  listPlatformUsers,
  setPlatformUserDisabled,
} from './admin';
export type { PlatformStats, PlatformUser, PlatformUsersPage } from './admin';
export {
  startMercadoPagoOAuth,
  disconnectMercadoPago,
  createCardCheckout,
} from './mercadopago';
export {
  getMembership,
  writeOwnerMembership,
  listMembers,
  listInvites,
  listPendingInvitesForEmail,
  listUserKitchens,
  setActiveKitchen,
  getUserProfile,
  saveUserPhone,
  inviteStaff,
  cancelInvite,
  removeMember,
  acceptInvite,
  resolveKitchenAccess,
} from './team';
export type { KitchenAccess } from './team';
export { productImagePath, uploadProductImage } from './storage';
