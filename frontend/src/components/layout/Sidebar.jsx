import { NavLink } from 'react-router-dom';
import { navItems } from './navItems.js';
import { cn } from '../../lib/cn.js';

const sections = ['General', 'Contabilidad', 'Reportes'];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
          F
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">Flowy · Contabilidad</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section}>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {section}
            </p>
            <ul className="space-y-0.5">
              {navItems
                .filter((item) => item.section === section)
                .map((item) => (
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
        ))}
      </nav>
    </aside>
  );
}
