/**
 * Une clases condicionalmente, ignorando valores falsy.
 * Mantiene los componentes del design system limpios y uniformes.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
