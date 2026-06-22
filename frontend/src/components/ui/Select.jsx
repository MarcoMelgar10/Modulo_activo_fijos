import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Select = forwardRef(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'h-10 rounded-md border bg-surface px-3 text-sm text-ink',
          'transition-colors focus-visible:ring-2 focus-visible:ring-accent-500/40',
          error ? 'border-red-400' : 'border-line',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
