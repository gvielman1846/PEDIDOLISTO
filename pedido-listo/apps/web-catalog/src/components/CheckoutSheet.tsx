import { useState } from 'react';
import type { Business, CartItem, CheckoutData } from '@pedido-listo/types';
import { createOrder, isFirebaseConfigured } from '@pedido-listo/firebase';
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  calculateOrderTotal,
  formatMXN,
} from '@pedido-listo/whatsapp';

interface Props {
  business: Business;
  items: CartItem[];
  subtotal: number;
  open: boolean;
  onClose: () => void;
}

export function CheckoutSheet({ business, items, subtotal, open, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [deliveryType, setDeliveryType] = useState<CheckoutData['deliveryType']>('delivery');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const { deliveryFee, total } = calculateOrderTotal(items, business, deliveryType);

  async function handleSend() {
    if (subtotal < business.minOrder) {
      alert(`Pedido mínimo: ${formatMXN(business.minOrder)}`);
      return;
    }
    if (!customerName.trim()) {
      alert('Escribe tu nombre');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('Escribe tu dirección');
      return;
    }

    const checkout: CheckoutData = {
      customerName: customerName.trim(),
      deliveryType,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
    };

    setSending(true);
    try {
      if (isFirebaseConfigured() && business.id) {
        await createOrder(business.id, {
          items,
          subtotal,
          deliveryFee,
          total,
          checkout,
        });
      }

      const message = buildOrderMessage(business, items, checkout);
      const url = buildWhatsAppUrl(business.whatsapp, message);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar el pedido. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="overlay open"
      aria-hidden="false"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-labelledby="checkout-title">
        <div className="sheet__handle" aria-hidden="true" />
        <h2 id="checkout-title">Tu pedido</h2>
        <p className="sheet__subtitle">{business.name}</p>

        <div className="order-summary">
          {items.map((item) => (
            <div key={item.productId} className="order-line">
              <span className="order-line__qty">{item.quantity}×</span>
              <span className="order-line__name">{item.name}</span>
              <span className="order-line__price">{formatMXN(item.price * item.quantity)}</span>
            </div>
          ))}

          {deliveryType === 'delivery' && deliveryFee > 0 && (
            <div className="order-line order-line--muted">
              <span className="order-line__name">Envío</span>
              <span className="order-line__price">{formatMXN(deliveryFee)}</span>
            </div>
          )}

          <div className="order-total">
            <span>Total</span>
            <span>{formatMXN(total)}</span>
          </div>
        </div>

        <div className="form-section">
          <h3>Datos de entrega</h3>

          <label htmlFor="customer-name">Tu nombre</label>
          <input
            id="customer-name"
            className="input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ej. María López"
            autoComplete="name"
          />

          <label>Tipo de pedido</label>
          <div className="delivery-toggle">
            <button
              type="button"
              className={`delivery-toggle__btn ${deliveryType === 'delivery' ? 'delivery-toggle__btn--active' : ''}`}
              onClick={() => setDeliveryType('delivery')}
            >
              🚚 Entrega
            </button>
            <button
              type="button"
              className={`delivery-toggle__btn ${deliveryType === 'pickup' ? 'delivery-toggle__btn--active' : ''}`}
              onClick={() => setDeliveryType('pickup')}
            >
              🏪 Recoger
            </button>
          </div>

          {deliveryType === 'delivery' && (
            <>
              <label htmlFor="customer-address">Dirección</label>
              <input
                id="customer-address"
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia"
              />
            </>
          )}

          <label htmlFor="customer-note">Nota para la cocina</label>
          <textarea
            id="customer-note"
            className="input input--textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sin picante, extra tortillas..."
          />
        </div>

        <div className="actions">
          <button type="button" className="btn-wa" onClick={handleSend} disabled={sending}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.533 5.847L0 24l6.335-1.662A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.79 9.79 0 01-4.99-1.364l-.357-.213-3.76.987 1.004-3.66-.233-.375A9.818 9.818 0 0112 2.182c5.403 0 9.818 4.415 9.818 9.818 0 5.403-4.415 9.818-9.818 9.818z"/>
            </svg>
            {sending ? 'Guardando...' : 'Enviar por WhatsApp'}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Seguir eligiendo
          </button>
        </div>
      </div>
    </div>
  );
}
