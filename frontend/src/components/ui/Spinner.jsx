import { cn } from '../../lib/cn.js';

export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink',
        className,
      )}
    />
  );
}
