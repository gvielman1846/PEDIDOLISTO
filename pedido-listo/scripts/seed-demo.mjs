/**
 * Seed demo business + menu for PedidoListo (Cocina Chef Cueto).
 * Run: npm run firebase:deploy && npm run seed:demo
 */
import { loadDemoMenu, seedBusiness, signIn } from './seed-lib.mjs';

const demoMenu = loadDemoMenu();
const firebase = await signIn();

const result = await seedBusiness(firebase, {
  businessId: 'demo',
  name: 'Cocina Chef Cueto',
  slug: 'cocina-chef-cueto',
  whatsapp: '525513690163',
  address: 'Alta California Residencial, Tlajomulco',
  deliveryFee: 25,
  minOrder: 80,
  openTime: '09:00',
  closeTime: '20:00',
  menu: demoMenu,
});

console.log(`\nNegocio demo listo: businesses/${result.businessId}`);
console.log(`Catalogo web: ${result.catalogUrl}`);
