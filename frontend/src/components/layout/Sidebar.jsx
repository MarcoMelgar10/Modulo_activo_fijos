import { NavLink } from 'react-router-dom';
import { navItems } from './navItems.js';
import { cn } from '../../lib/cn.js';
import { useAuth } from '../../store/AuthContext.jsx';

const sections = ['General', 'Ventas', 'Compras', 'Inventario', 'Contabilidad', 'Reportes Financieros', 'Presupuesto', 'Administración'];

export function Sidebar() {
  const { user } = useAuth();
  const rol = user?.rol?.nombre;

  // Solo los ítems que el rol puede ver (RF-USR-02).
  const visibles = navItems.filter((item) => !item.roles || item.roles.includes(rol));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
          F
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">Flowy · ERP</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => {
          const items = visibles.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
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
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
