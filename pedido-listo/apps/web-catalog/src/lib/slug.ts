import { DEMO_BUSINESS } from '../data/mock';

export function getSlugFromPath(): string {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return slug || DEMO_BUSINESS.slug;
}
