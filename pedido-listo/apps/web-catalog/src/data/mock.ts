import type { Business, Category, Product } from '@pedido-listo/types';
import demoMenu from './demo-menu.json';

export const DEMO_BUSINESS: Business = {
  id: 'demo',
  name: 'Cocina Chef Cueto',
  slug: 'cocina-chef-cueto',
  whatsapp: '525513690163',
  address: 'Alta California Residencial, Tlajomulco',
  deliveryFee: 25,
  minOrder: 80,
  openTime: '09:00',
  closeTime: '20:00',
  isOpen: true,
  plan: 'free',
};

export const DEMO_CATEGORIES: Category[] = demoMenu.categories;

export const DEMO_PRODUCTS: Product[] = demoMenu.products.map((product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  categoryId: product.categoryId,
  emoji: product.emoji,
  imageUrl: `/images/products/${product.imageFile}`,
  available: product.available,
  order: product.order,
}));
