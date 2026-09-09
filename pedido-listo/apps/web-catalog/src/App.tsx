import { useMemo, useState } from 'react';
import type { Business, Category, Product } from '@pedido-listo/types';
import { BusinessHero } from './components/BusinessHero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartBar } from './components/CartBar';
import { CheckoutSheet } from './components/CheckoutSheet';
import { useCart } from './hooks/useCart';
import { useCatalog } from './hooks/useCatalog';
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
          <p className="status-title">Menu vacio</p>
          <p className="status-text">Corre <code>npm run seed:demo</code> para cargar platillos en Firebase.</p>
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
        </>
      )}
    </div>
  );
}

function App() {
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return (
      <div className="app-shell app-shell--centered">
        <div className="status-card">
          <div className="status-spinner" />
          <p className="status-title">Cargando menu...</p>
        </div>
      </div>
    );
  }

  if (catalog.status === 'not-found') {
    return (
      <div className="app-shell app-shell--centered">
        <div className="status-card">
          <p className="status-title">Cocina no encontrada</p>
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

export default App;
