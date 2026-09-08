import { useCallback, useMemo, useState } from 'react';
import type { CartItem, Product } from '@pedido-listo/types';

export function useCart(products: Product[]) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  }, []);

  const items: CartItem[] = useMemo(() => {
    return Object.entries(quantities)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        return {
          productId,
          name: product.name,
          price: product.price,
          quantity,
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [quantities, products]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const clear = useCallback(() => setQuantities({}), []);

  return { quantities, items, itemCount, subtotal, updateQuantity, clear };
}
