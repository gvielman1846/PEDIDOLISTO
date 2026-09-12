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
      return '#2563eb';
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

export function formatDayLabel(value: Date): string {
  return value.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export { ORDER_STATUS_LABELS };
