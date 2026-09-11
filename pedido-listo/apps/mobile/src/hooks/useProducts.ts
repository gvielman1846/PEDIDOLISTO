import { useCallback, useEffect, useState } from 'react';
import type { Category, Product } from '@pedido-listo/types';
import {
  createProduct,
  deleteProduct,
  getCategories,
  newProductId,
  subscribeToProducts,
  updateProduct,
  updateProductAvailability,
  uploadProductImage,
} from '@pedido-listo/firebase';
import { uriToBlob } from '../lib/upload';

export interface NewProductDraft {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  emoji?: string;
  imageUri?: string;
  imageMimeType?: string;
}

export function useProducts(businessId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts(
      businessId,
      (next) => {
        setProducts(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;

    getCategories(businessId)
      .then((next) => {
        if (!cancelled) setCategories(next);
      })
      .catch(() => {
        // el alta de platillos sigue funcionando sin categorias cargadas
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const toggleAvailable = useCallback(
    async (productId: string, available: boolean) => {
      try {
        await updateProductAvailability(businessId, productId, available);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el platillo');
      }
    },
    [businessId]
  );

  const addProduct = useCallback(
    async (draft: NewProductDraft): Promise<string | null> => {
      const productId = newProductId(businessId);
      let imageUrl: string | undefined;
      let photoWarning: string | null = null;

      // La foto se sube antes de crear el documento para no dejar un platillo a
      // medias, pero si falla se guarda igual: perder el platillo es peor.
      if (draft.imageUri) {
        try {
          const blob = await uriToBlob(draft.imageUri);
          imageUrl = await uploadProductImage(
            businessId,
            productId,
            blob,
            draft.imageMimeType ?? 'image/jpeg'
          );
        } catch (err) {
          const code = (err as { code?: string })?.code;
          const detail = code ?? (err instanceof Error ? err.message : 'error desconocido');
          photoWarning = `Se guardo el platillo, pero la foto no subio: ${detail}`;
        }
      }

      await createProduct(businessId, productId, {
        name: draft.name,
        description: draft.description,
        price: draft.price,
        categoryId: draft.categoryId,
        emoji: draft.emoji,
        imageUrl,
        order: products.length,
      });

      return photoWarning;
    },
    [businessId, products.length]
  );

  const editProduct = useCallback(
    async (productId: string, draft: NewProductDraft): Promise<string | null> => {
      let imageUrl: string | undefined;
      let photoWarning: string | null = null;

      if (draft.imageUri) {
        try {
          const blob = await uriToBlob(draft.imageUri);
          imageUrl = await uploadProductImage(
            businessId,
            productId,
            blob,
            draft.imageMimeType ?? 'image/jpeg'
          );
        } catch (err) {
          const code = (err as { code?: string })?.code;
          const detail = code ?? (err instanceof Error ? err.message : 'error desconocido');
          photoWarning = `Se guardaron los datos, pero la foto no subio: ${detail}`;
        }
      }

      await updateProduct(businessId, productId, {
        name: draft.name,
        description: draft.description,
        price: draft.price,
        categoryId: draft.categoryId,
        emoji: draft.emoji,
        imageUrl,
      });

      return photoWarning;
    },
    [businessId]
  );

  const removeProduct = useCallback(
    async (productId: string) => {
      try {
        await deleteProduct(businessId, productId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el platillo');
        throw err;
      }
    },
    [businessId]
  );

  return {
    products,
    categories,
    loading,
    error,
    toggleAvailable,
    addProduct,
    editProduct,
    removeProduct,
  };
}
