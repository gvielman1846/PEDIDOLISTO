import { useEffect, useMemo, useState } from 'react';
import type { Business, Category, Product } from '@pedido-listo/types';
import { BusinessHero } from './components/BusinessHero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartBar } from './components/CartBar';
import { CheckoutSheet } from './components/CheckoutSheet';
import { HelpPage } from './pages/HelpPage';
import { LandingPage } from './pages/LandingPage';
import { useCart } from './hooks/useCart';
import { useCatalog } from './hooks/useCatalog';
import {
  clearPaymentQuery,
  clearPendingCheckout,
  paymentReturnFromUrl,
  readPendingCheckout,
} from './lib/checkoutSession';
import { buildOrderMessage, buildWhatsAppUrl, openWhatsApp } from '@pedido-listo/whatsapp';
import './App.css';

interface ReadyCatalog {
  business: Business;
  categories: Category[];
  products: Product[];
  source: 'firebase' | 'mock';
}

function CatalogView({ business, categories, products, source }: ReadyCatalog) {
  const [activeCat, setActiveCat] = useState('Todos');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { quantities, items, itemCount, subtotal, updateQuantity } = useCart(products);
  const [paymentReturn, setPaymentReturn] = useState<'ok' | 'error' | 'pendiente' | null>(null);

  useEffect(() => {
    const result = paymentReturnFromUrl();
    if (!result) return;
    setPaymentReturn(result);
    clearPaymentQuery();
  }, []);

  const categoryNames = useMemo(
    () => ['Todos', ...categories.map((c) => c.name)],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    if (activeCat === 'Todos') return products;
    const cat = categories.find((c) => c.name === activeCat);
    if (!cat) return products;
    return products.filter((p) => p.categoryId === cat.id);
  }, [activeCat, categories, products]);

  return (
    <div className="app-shell">
      <BusinessHero business={business} />

      {source === 'mock' && (
        <p className="catalog-banner">Modo demo local — Firebase no configurado</p>
      )}

      {products.length === 0 ? (
        <div className="empty-menu">
          <p className="status-title">Sin productos</p>
          <p className="status-text">Corre <code>npm run seed:demo</code> para cargar productos en Firebase.</p>
        </div>
      ) : (
        <>
          <div className="menu-sticky">
            <CategoryFilter
              categories={categoryNames}
              active={activeCat}
              onChange={setActiveCat}
            />
          </div>

          <main className="menu-content">
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantities[product.id!] ?? 0}
                  onUpdateQuantity={(delta) => updateQuantity(product.id!, delta)}
                />
              ))}
            </div>
          </main>

          <CartBar
            itemCount={itemCount}
            subtotal={subtotal}
            onOpenCheckout={() => setCheckoutOpen(true)}
          />

          <CheckoutSheet
            business={business}
            items={items}
            subtotal={subtotal}
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
          />

          {paymentReturn && (
            <div
              className="overlay open"
              onClick={(e) => e.target === e.currentTarget && setPaymentReturn(null)}
            >
              <div className="sheet" role="dialog">
                <h2>
                  {paymentReturn === 'ok'
                    ? 'Pago listo'
                    : paymentReturn === 'pendiente'
                      ? 'Pago pendiente'
                      : 'No se completo el pago'}
                </h2>
                <p className="sheet__subtitle">
                  {paymentReturn === 'ok'
                    ? 'El negocio ya recibio tu pedido. Si quieres, avisa tambien por WhatsApp.'
                    : paymentReturn === 'pendiente'
                      ? 'Mercado Pago sigue confirmando el cobro. El negocio vera el pedido cuando se apruebe.'
                      : 'No se cobro. El negocio no va a preparar este pedido.'}
                </p>
                {paymentReturn === 'ok' && business.whatsapp && (
                  <button
                    type="button"
                    className="btn-wa"
                    onClick={() => {
                      const stored = readPendingCheckout();
                      if (stored) {
                        const message = buildOrderMessage(business, stored.items, stored.checkout);
                        openWhatsApp(buildWhatsAppUrl(business.whatsapp, message));
                      }
                      clearPendingCheckout();
                      setPaymentReturn(null);
                    }}
                  >
                    Enviar por WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    if (paymentReturn !== 'ok') clearPendingCheckout();
                    setPaymentReturn(null);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CatalogApp() {
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return (
      <div className="app-shell app-shell--centered">
        <div className="status-card">
          <div className="status-spinner" />
          <p className="status-title">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (catalog.status === 'not-found') {
    return (
      <div className="app-shell app-shell--centered">
        <div className="status-card">
          <p className="status-title">Negocio no encontrado</p>
          <p className="status-text">
            No existe un negocio con el enlace <strong>/{catalog.slug}</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (catalog.status === 'error') {
    return (
      <div className="app-shell app-shell--centered">
        <div className="status-card">
          <p className="status-title">Error al cargar</p>
          <p className="status-text">{catalog.message}</p>
        </div>
      </div>
    );
  }

  return (
    <CatalogView
      business={catalog.business}
      categories={catalog.categories}
      products={catalog.products}
      source={catalog.source}
    />
  );
}

function App() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!path) return <LandingPage />;
  if (path === 'ayuda') return <HelpPage />;
  return <CatalogApp />;
}

export default App;
