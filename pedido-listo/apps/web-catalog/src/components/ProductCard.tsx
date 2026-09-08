import type { Product } from '@pedido-listo/types';
import { formatMXN } from '@pedido-listo/whatsapp';
import { ProductImage } from './ProductImage';

interface Props {
  product: Product;
  quantity: number;
  onUpdateQuantity: (delta: number) => void;
}

export function ProductCard({ product, quantity, onUpdateQuantity }: Props) {
  return (
    <article className={`product-card ${!product.available ? 'product-card--sold-out' : ''}`}>
      <ProductImage product={product} />

      <div className="product-card__body">
        <div className="product-card__header">
          <h3>{product.name}</h3>
          <span className="product-card__price">{formatMXN(product.price)}</span>
        </div>

        <p className="product-card__desc">{product.description}</p>

        {!product.available ? (
          <span className="sold-out-badge">Agotado hoy</span>
        ) : quantity === 0 ? (
          <button
            type="button"
            className="btn-add"
            onClick={() => onUpdateQuantity(1)}
          >
            Agregar
          </button>
        ) : (
          <div className="qty-control">
            <button
              type="button"
              className="qty-control__btn"
              aria-label="Quitar"
              onClick={() => onUpdateQuantity(-1)}
            >
              −
            </button>
            <span className="qty-control__count">{quantity}</span>
            <button
              type="button"
              className="qty-control__btn"
              aria-label="Agregar"
              onClick={() => onUpdateQuantity(1)}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
