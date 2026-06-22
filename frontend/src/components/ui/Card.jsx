import { cn } from '../../lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-line px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-sm font-semibold text-ink', className)}>{children}</h3>;
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
