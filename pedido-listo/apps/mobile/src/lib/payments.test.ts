import assert from 'node:assert/strict';
import test from 'node:test';
import { enabledPaymentMethods, isOrderVisibleToStaff } from '@pedido-listo/types';

test('oculta tarjeta si Mercado Pago no esta conectado', () => {
  const methods = enabledPaymentMethods({
    paymentMethods: ['efectivo', 'transferencia', 'tarjeta'],
    mercadoPagoConnected: false,
  });
  assert.deepEqual(methods, ['efectivo', 'transferencia']);
});

test('muestra tarjeta cuando Mercado Pago esta conectado', () => {
  const methods = enabledPaymentMethods({
    paymentMethods: ['efectivo', 'tarjeta'],
    mercadoPagoConnected: true,
  });
  assert.deepEqual(methods, ['efectivo', 'tarjeta']);
});

test('la cocina no ve pedidos de tarjeta sin cobro', () => {
  assert.equal(isOrderVisibleToStaff({ paymentMethod: 'tarjeta', paymentStatus: 'pending' }), false);
  assert.equal(isOrderVisibleToStaff({ paymentMethod: 'tarjeta', paymentStatus: 'paid' }), true);
  assert.equal(isOrderVisibleToStaff({ paymentMethod: 'efectivo' }), true);
});
