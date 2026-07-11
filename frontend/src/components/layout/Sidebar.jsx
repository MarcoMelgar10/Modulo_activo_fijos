import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navItems, navSections } from './navItems.js';
import { SectionIcon } from './SectionIcon.jsx';
import { cn } from '../../lib/cn.js';
import { useAuth } from '../../store/AuthContext.jsx';

const STORAGE_KEY = 'flowy.sidebar.secciones';

function leerAbiertas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage no disponible: se usa el estado por defecto */
  }
  return null;
}

function Chevron({ abierta }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', abierta ? 'rotate-0' : '-rotate-90')}
    >
      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function Sidebar({ visible = true }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const rol = user?.rol?.nombre;

  // Solo los ítems que el rol puede ver (RF-USR-02).
  const visibles = navItems.filter((item) => !item.roles || item.roles.includes(rol));

  // Secciones desplegadas: por defecto todas; la elección del usuario se recuerda.
  const [abiertas, setAbiertas] = useState(() => leerAbiertas() ?? navSections);

  // La sección de la ruta activa se mantiene siempre desplegada.
  useEffect(() => {
    const actual = navItems.find((item) => item.to === pathname)?.section;
    if (actual) setAbiertas((prev) => (prev.includes(actual) ? prev : [...prev, actual]));
  }, [pathname]);

  const alternar = (section) => {
    setAbiertas((prev) => {
      const next = prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* sin persistencia */
      }
      return next;
    });
  };

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

      <nav className="w-60 flex-1 space-y-4 overflow-y-auto px-3 py-5">
        {navSections.map((section) => {
          const items = visibles.filter((item) => item.section === section);
          if (items.length === 0) return null;
          const abierta = abiertas.includes(section);
          return (
            <div key={section}>
              <button
                type="button"
                onClick={() => alternar(section)}
                aria-expanded={abierta}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink-muted"
              >
                <SectionIcon name={section} className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">{section}</span>
                <Chevron abierta={abierta} />
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200',
                  abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <ul className="space-y-0.5 overflow-hidden pt-1">
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
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
