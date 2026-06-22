import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Input = forwardRef(function Input({ className, label, error, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-10 rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-ink-soft',
          'transition-colors focus-visible:ring-2 focus-visible:ring-accent-500/40',
          error ? 'border-red-400' : 'border-line',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
