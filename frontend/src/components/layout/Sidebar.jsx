import { Link, NavLink } from 'react-router-dom';
import { moduleItems } from './navItems.js';
import { SectionIcon } from './SectionIcon.jsx';
import { cn } from '../../lib/cn.js';
import { useAuth } from '../../store/AuthContext.jsx';

// Barra lateral contextual: solo se muestra dentro de un módulo (ver AppShell) y
// lista únicamente las funciones de ese módulo accesibles para el rol (RF-USR-02).
// En el menú principal no se renderiza.
export function Sidebar({ section, visible = true }) {
  const { user } = useAuth();
  const rol = user?.rol?.nombre;

  if (!section) return null;

  const items = moduleItems(section, rol);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col overflow-hidden border-r border-line bg-surface transition-[width] duration-200 md:flex',
        visible ? 'w-60' : 'w-0 border-r-0',
      )}
    >
      <div className="flex h-16 w-60 shrink-0 items-center gap-2 border-b border-line px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
          F
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">Flowy · ERP</span>
      </div>

      <nav className="w-60 flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <Link
          to="/"
          className="mb-2 flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4 shrink-0">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Todos los módulos
        </Link>

        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          <SectionIcon name={section} className="h-3.5 w-3.5" />
          <span className="flex-1">{section}</span>
        </div>

        <ul className="space-y-0.5 pt-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-2.5 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-surface-sunken font-medium text-ink'
                      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
