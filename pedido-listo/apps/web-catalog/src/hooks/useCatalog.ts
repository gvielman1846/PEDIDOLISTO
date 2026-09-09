import { useEffect, useState } from 'react';
import type { Business, Category, Product } from '@pedido-listo/types';
import { isFirebaseConfigured, loadCatalogBySlug } from '@pedido-listo/firebase';
import { DEMO_BUSINESS, DEMO_CATEGORIES, DEMO_PRODUCTS } from '../data/mock';
import { getSlugFromPath } from '../lib/slug';

type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; business: Business; categories: Category[]; products: Product[]; source: 'firebase' | 'mock' }
  | { status: 'not-found'; slug: string }
  | { status: 'error'; message: string };

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    const slug = getSlugFromPath();
    let cancelled = false;

    async function load() {
      if (!isFirebaseConfigured()) {
        if (!cancelled) {
          setState({
            status: 'ready',
            business: DEMO_BUSINESS,
            categories: DEMO_CATEGORIES,
            products: DEMO_PRODUCTS,
            source: 'mock',
          });
        }
        return;
      }

      try {
        const catalog = await loadCatalogBySlug(slug);
        if (cancelled) return;

        if (!catalog) {
          setState({ status: 'not-found', slug });
          return;
        }

        setState({
          status: 'ready',
          business: catalog.business,
          categories: catalog.categories,
          products: catalog.products,
          source: 'firebase',
        });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'No se pudo cargar el catalogo',
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
