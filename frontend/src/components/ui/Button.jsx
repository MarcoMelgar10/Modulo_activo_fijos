import { cn } from '../../lib/cn.js';

const variants = {
  primary: 'bg-ink text-white hover:bg-ink/90 disabled:bg-ink/40',
  secondary: 'bg-white text-ink border border-line hover:bg-surface-sunken disabled:opacity-50',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-accent-500/40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
