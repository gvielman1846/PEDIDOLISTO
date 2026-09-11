export const CATALOG_BASE_URL = 'https://pedidolisto-jet.vercel.app';

export function buildCatalogUrl(slug: string): string {
  return `${CATALOG_BASE_URL}/${slug}`;
}

/**
 * El seed guarda imageUrl como URL de Firebase Storage, o como ruta relativa
 * (/images/products/1.svg) cuando la subida falla. La ruta relativa solo funciona
 * en la web, asi que en movil hay que resolverla contra el catalogo publicado.
 */
export function resolveProductImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/')) return `${CATALOG_BASE_URL}${imageUrl}`;
  return null;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^[^/]+\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
