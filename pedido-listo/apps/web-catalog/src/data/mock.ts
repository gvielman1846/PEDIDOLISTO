import type { Business, Category, Product } from '@pedido-listo/types';

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

export const DEMO_CATEGORIES: Category[] = [
  { id: 'antojitos', name: 'Antojitos', order: 0 },
  { id: 'platos', name: 'Platos fuertes', order: 1 },
  { id: 'bebidas', name: 'Bebidas', order: 2 },
  { id: 'postres', name: 'Postres', order: 3 },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: '1', name: 'Tacos de guisado (3 pzas)', description: 'Tinga, picadillo o chicharrón', price: 45, categoryId: 'antojitos', emoji: '🌮', available: true, order: 0 },
  { id: '2', name: 'Quesadilla grande', description: 'Tortilla de maíz, queso Oaxaca', price: 35, categoryId: 'antojitos', emoji: '🧀', available: true, order: 1 },
  { id: '3', name: 'Enchiladas verdes', description: 'Pollo, arroz y frijoles', price: 95, categoryId: 'platos', emoji: '🍽️', available: true, order: 0 },
  { id: '4', name: 'Mole con pollo', description: '2 piezas, arroz y tortillas', price: 110, categoryId: 'platos', emoji: '🍗', available: true, order: 1 },
  { id: '5', name: 'Pozole chico', description: 'Cerdo o pollo, 500 ml', price: 75, categoryId: 'platos', emoji: '🥣', available: true, order: 2 },
  { id: '6', name: 'Agua de horchata', description: '1 litro', price: 40, categoryId: 'bebidas', emoji: '🥤', available: true, order: 0 },
  { id: '7', name: 'Refresco 600 ml', description: 'Coca, Sprite o Manzanita', price: 25, categoryId: 'bebidas', emoji: '🧃', available: true, order: 1 },
  { id: '8', name: 'Flan napolitano', description: 'Porción individual', price: 35, categoryId: 'postres', emoji: '🍮', available: true, order: 0 },
];
