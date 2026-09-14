import assert from 'node:assert/strict';
import test from 'node:test';
import type { Order } from '@pedido-listo/types';
import { buildOrderReceipt, RECEIPT_WIDTH, wrapReceiptText } from './receipt';

const order: Order = {
  id: 'pedido-12345678',
  items: [
    { productId: '1', name: 'Tacos de barbacoa con consome', price: 35, quantity: 3 },
    { productId: '2', name: 'Agua de jamaica', price: 25, quantity: 1 },
  ],
  subtotal: 130,
  deliveryFee: 20,
  total: 150,
  customerName: 'Maria Lopez',
  customerPhone: '3312345678',
  deliveryType: 'delivery',
  address: 'Calle Siempre Viva 123, Colonia Centro',
  note: 'Sin cebolla y tocar el timbre',
  paymentMethod: 'efectivo',
  status: 'nuevo',
  createdAt: new Date(2026, 8, 14, 17, 42),
  source: 'whatsapp',
};

test('crea un ticket completo de pedido', () => {
  const receipt = buildOrderReceipt(order, 'Taqueria El Güero');

  assert.match(receipt, /Taqueria El Güero/);
  assert.match(receipt, /Folio: 12345678/);
  assert.match(receipt, /3x Tacos de barbacoa/);
  assert.match(receipt, /TOTAL\s+\$150\.00/);
  assert.match(receipt, /Pago: Efectivo/);
  assert.match(receipt, /NOTA:/);
});

test('ninguna linea rebasa el ancho de una impresora de 58 mm', () => {
  const receipt = buildOrderReceipt(order, 'Un negocio con un nombre demasiado largo para el papel');
  for (const line of receipt.split('\n')) {
    assert.ok(line.length <= RECEIPT_WIDTH, `"${line}" mide ${line.length}`);
  }
});

test('parte palabras muy largas sin perder contenido', () => {
  const lines = wrapReceiptText('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 10);
  assert.deepEqual(lines, ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ1234', '567890']);
});
