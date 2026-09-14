import { PAYMENT_METHOD_LABELS, type Order } from '@pedido-listo/types';

export const RECEIPT_WIDTH = 32;

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function dateTime(value?: Date): string {
  const date = value ?? new Date();
  const part = (number: number) => String(number).padStart(2, '0');
  return `${part(date.getDate())}/${part(date.getMonth() + 1)}/${date.getFullYear()} ${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function wrapReceiptText(value: string, width = RECEIPT_WIDTH): string[] {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const lines: string[] = [];
  let remaining = clean;
  while (remaining.length > width) {
    let cut = remaining.lastIndexOf(' ', width);
    if (cut < 1) cut = width;
    lines.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) lines.push(remaining);
  return lines;
}

function centered(value: string): string[] {
  return wrapReceiptText(value).map((line) => {
    const left = Math.max(0, Math.floor((RECEIPT_WIDTH - line.length) / 2));
    return `${' '.repeat(left)}${line}`;
  });
}

function columns(left: string, right: string): string[] {
  const available = RECEIPT_WIDTH - right.length - 1;
  const leftLines = wrapReceiptText(left, Math.max(8, available));
  if (leftLines.length === 0) return [right.padStart(RECEIPT_WIDTH)];
  return leftLines.map((line, index) =>
    index === leftLines.length - 1
      ? `${line}${' '.repeat(Math.max(1, RECEIPT_WIDTH - line.length - right.length))}${right}`
      : line
  );
}

export function buildOrderReceipt(
  order: Order,
  businessName: string,
  printedAt = new Date()
): string {
  const lines: string[] = [
    ...centered(businessName || 'PedidoListo'),
    ...centered('PEDIDO'),
    '-'.repeat(RECEIPT_WIDTH),
    `Folio: ${order.id?.slice(-8).toUpperCase() || 'SIN FOLIO'}`,
    `Fecha: ${dateTime(order.createdAt ?? printedAt)}`,
    ...wrapReceiptText(`Cliente: ${order.customerName}`),
  ];

  if (order.customerPhone) lines.push(`Tel: ${order.customerPhone}`);
  lines.push('-'.repeat(RECEIPT_WIDTH));

  for (const item of order.items) {
    lines.push(...columns(`${item.quantity}x ${item.name}`, money(item.price * item.quantity)));
  }

  lines.push('-'.repeat(RECEIPT_WIDTH));
  lines.push(...columns('Subtotal', money(order.subtotal)));
  if (order.deliveryFee > 0) lines.push(...columns('Envio', money(order.deliveryFee)));
  lines.push(...columns('TOTAL', money(order.total)));

  if (order.paymentMethod) {
    lines.push(...wrapReceiptText(`Pago: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`));
  }
  lines.push(`Entrega: ${order.deliveryType === 'delivery' ? 'A domicilio' : 'Recoger'}`);
  if (order.address) lines.push(...wrapReceiptText(`Direccion: ${order.address}`));
  if (order.note) {
    lines.push('-'.repeat(RECEIPT_WIDTH), 'NOTA:', ...wrapReceiptText(order.note));
  }

  lines.push('-'.repeat(RECEIPT_WIDTH), ...centered('Gracias por tu compra'), '');
  return lines.join('\n');
}
