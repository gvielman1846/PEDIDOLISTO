import { useMemo, useState } from 'react';
import { BusinessHero } from './components/BusinessHero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartBar } from './components/CartBar';
import { CheckoutSheet } from './components/CheckoutSheet';
import { DEMO_BUSINESS, DEMO_CATEGORIES, DEMO_PRODUCTS } from './data/mock';
import { useCart } from './hooks/useCart';
import './App.css';

function App() {
  const [activeCat, setActiveCat] = useState('Todos');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { quantities, items, itemCount, subtotal, updateQuantity } = useCart(DEMO_PRODUCTS);

  const categoryNames = useMemo(
    () => ['Todos', ...DEMO_CATEGORIES.map((c) => c.name)],
    []
  );

  const filteredProducts = useMemo(() => {
    if (activeCat === 'Todos') return DEMO_PRODUCTS;
    const cat = DEMO_CATEGORIES.find((c) => c.name === activeCat);
    if (!cat) return DEMO_PRODUCTS;
    return DEMO_PRODUCTS.filter((p) => p.categoryId === cat.id);
  }, [activeCat]);

  return (
    <div className="app-shell">
      <BusinessHero business={DEMO_BUSINESS} />

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
        business={DEMO_BUSINESS}
        items={items}
        subtotal={subtotal}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}

export default App;
