import type { Business, CartItem, CheckoutData } from '@pedido-listo/types';

export function formatMXN(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}

export function calculateOrderTotal(
  items: CartItem[],
  business: Pick<Business, 'deliveryFee'>,
  deliveryType: CheckoutData['deliveryType']
): { subtotal: number; deliveryFee: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? business.deliveryFee : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

function formatOrderTime(): string {
  return new Date().toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function separator(): string {
  return '────────────────────';
}

export function buildOrderMessage(
  business: Pick<Business, 'name' | 'deliveryFee'>,
  items: CartItem[],
  checkout: CheckoutData
): string {
  const { subtotal, deliveryFee, total } = calculateOrderTotal(
    items,
    business,
    checkout.deliveryType
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryLabel =
    checkout.deliveryType === 'delivery' ? 'Entrega a domicilio' : 'Recoger en local';

  const productLines = items
    .map((item, i) => {
      const lineTotal = formatMXN(item.price * item.quantity);
      return `${i + 1}. *${item.name}*\n   ${item.quantity} pza${item.quantity > 1 ? 's' : ''} · ${lineTotal}`;
    })
    .join('\n\n');

  const sections = [
    `*NUEVO PEDIDO*`,
    `*${business.name}*`,
    formatOrderTime(),
    separator(),
    ``,
    `*PRODUCTOS (${itemCount})*`,
    ``,
    productLines,
    ``,
    separator(),
    `*RESUMEN DE PAGO*`,
    `Subtotal: ${formatMXN(subtotal)}`,
  ];

  if (checkout.deliveryType === 'delivery' && deliveryFee > 0) {
    sections.push(`Envio: ${formatMXN(deliveryFee)}`);
  }

  sections.push(
    `*TOTAL: ${formatMXN(total)}*`,
    ``,
    separator(),
    `*DATOS DEL CLIENTE*`,
    `Nombre: ${checkout.customerName}`,
    `Entrega: ${deliveryLabel}`
  );

  if (checkout.address) {
    sections.push(`Direccion: ${checkout.address}`);
  }

  if (checkout.note) {
    sections.push(`Nota cocina: _${checkout.note}_`);
  }

  sections.push(
    ``,
    separator(),
    `_Pedido enviado con PedidoListo_`
  );

  return sections.join('\n');
}

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const phone = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
