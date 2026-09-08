import type { Business } from '@pedido-listo/types';

interface Props {
  business: Business;
}

export function BusinessHero({ business }: Props) {
  return (
    <header className="storefront">
      <div className="storefront__cover" aria-hidden="true" />

      <div className="storefront__card">
        <div className="storefront__avatar" aria-hidden="true">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="" />
          ) : (
            <span>🍲</span>
          )}
        </div>

        <div className="storefront__info">
          <h1>{business.name}</h1>
          <p className="storefront__location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            {business.address ?? 'Comida casera'}
          </p>
        </div>

        <div className="storefront__meta">
          {business.isOpen && (
            <span className="meta-chip meta-chip--open">
              <span className="meta-dot" /> Abierto
            </span>
          )}
          {business.closeTime && (
            <span className="meta-chip">Cierra {business.closeTime}</span>
          )}
          {business.minOrder > 0 && (
            <span className="meta-chip">Mín. ${business.minOrder}</span>
          )}
          {business.deliveryFee > 0 && (
            <span className="meta-chip">Envío ${business.deliveryFee}</span>
          )}
        </div>
      </div>
    </header>
  );
}
