import {
  DEMO_BUSINESS_ID,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from '@pedido-listo/types';
import { colors } from '../theme';

export const BUSINESS_ID = DEMO_BUSINESS_ID;

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

export function getDeliveryLabel(order: Order): string {
  return order.deliveryType === 'delivery' ? 'Entrega a domicilio' : 'Recoger en local';
}

export { ORDER_STATUS_LABELS };
