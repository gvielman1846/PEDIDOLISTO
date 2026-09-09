import { useState } from 'react';
import type { Product } from '@pedido-listo/types';

const CATEGORY_GRADIENTS: Record<string, string> = {
  antojitos: 'linear-gradient(145deg, #fef3c7 0%, #fdba74 100%)',
  platos: 'linear-gradient(145deg, #fee2e2 0%, #fca5a5 100%)',
  bebidas: 'linear-gradient(145deg, #dbeafe 0%, #93c5fd 100%)',
  postres: 'linear-gradient(145deg, #fce7f3 0%, #f9a8d4 100%)',
};

export function getProductGradient(categoryId: string): string {
  return CATEGORY_GRADIENTS[categoryId] ?? 'linear-gradient(145deg, #f5f5f4 0%, #e7e5e4 100%)';
}

export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const showImage = product.imageUrl && !failed;

  if (showImage) {
    return (
      <div className="card-media">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="card-media card-media-placeholder"
      style={{ background: getProductGradient(product.categoryId) }}
      aria-hidden="true"
    >
      <span className="card-emoji">{product.emoji ?? '🍽️'}</span>
    </div>
  );
}
