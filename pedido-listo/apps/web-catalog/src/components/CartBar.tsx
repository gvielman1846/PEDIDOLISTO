import { formatMXN } from '@pedido-listo/whatsapp';

interface Props {
  itemCount: number;
  subtotal: number;
  onOpenCheckout: () => void;
}

export function CartBar({ itemCount, subtotal, onOpenCheckout }: Props) {
  if (itemCount === 0) return null;

  return (
    <div className="cart-float">
      <div className="cart-float__inner">
        <div className="cart-float__summary">
          <span className="cart-float__count">{itemCount}</span>
          <div>
            <strong>Ver pedido</strong>
            <small>{formatMXN(subtotal)}</small>
          </div>
        </div>
        <button type="button" className="cart-float__btn" onClick={onOpenCheckout}>
          Continuar
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
