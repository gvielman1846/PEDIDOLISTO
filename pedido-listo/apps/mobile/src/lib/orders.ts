import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type StaffRole,
} from '@pedido-listo/types';
import { colors } from '../theme';

export function formatTime(date?: Date): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function formatMXN(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'nuevo':
      return colors.accent;
    case 'preparando':
      return '#60a5fa';
    case 'listo':
      return colors.success;
    case 'entregado':
      return colors.muted;
  }
}

export function getNextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[index + 1];
}

export function getNextStatusForRole(status: OrderStatus, role: StaffRole): OrderStatus | null {
  if (role === 'kitchen') {
    if (status === 'nuevo') return 'preparando';
    if (status === 'preparando') return 'listo';
    return null;
  }
  if (role === 'delivery') {
    if (status === 'listo') return 'entregado';
    return null;
  }
  return getNextStatus(status);
}

export function getDeliveryLabel(order: Order): string {
  return order.deliveryType === 'delivery' ? 'Entrega a domicilio' : 'Recoger en local';
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameLocalDay(value?: Date, other = new Date()): boolean {
  if (!value) return true;
  const a = startOfLocalDay(value);
  const b = startOfLocalDay(other);
  return a.getTime() === b.getTime();
}

export function dayKey(value?: Date): string {
  const date = value ? startOfLocalDay(value) : startOfLocalDay();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Etiqueta fija en vez de toLocaleDateString: en Android el largo que devuelve
 * Intl varia y desacomoda el chip del calendario.
 */
export function formatDayLabel(value: Date): string {
  return `${WEEKDAYS[value.getDay()]} ${value.getDate()} ${MONTHS[value.getMonth()]}`;
}

export interface DaySaleLine {
  key: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export function summarizeDaySales(orders: Order[]): {
  lines: DaySaleLine[];
  articleTotal: number;
  deliveryTotal: number;
  total: number;
} {
  const map = new Map<string, DaySaleLine>();
  let deliveryTotal = 0;

  for (const order of orders) {
    if (order.status !== 'entregado') continue;
    deliveryTotal += order.deliveryFee ?? 0;
    for (const item of order.items) {
      const key = `${item.productId}|${item.price}`;
      const current = map.get(key);
      if (current) {
        current.quantity += item.quantity;
        current.amount += item.price * item.quantity;
      } else {
        map.set(key, {
          key,
          name: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          amount: item.price * item.quantity,
        });
      }
    }
  }

  const lines = [...map.values()].sort(
    (a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'es')
  );
  const articleTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, articleTotal, deliveryTotal, total: articleTotal + deliveryTotal };
}

export { ORDER_STATUS_LABELS };
