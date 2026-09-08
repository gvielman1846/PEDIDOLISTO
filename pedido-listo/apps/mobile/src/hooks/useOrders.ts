import { useEffect, useState } from 'react';
import type { Order } from '@pedido-listo/types';
import { subscribeToOrders } from '@pedido-listo/firebase';

export function useOrders(businessId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToOrders(
      businessId,
      (next) => {
        setOrders(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [businessId]);

  const activeOrders = orders.filter((o) => o.status !== 'entregado');
  const newCount = orders.filter((o) => o.status === 'nuevo').length;

  return { orders, activeOrders, newCount, loading, error };
}
