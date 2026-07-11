import { useAuth } from '../../store/AuthContext.jsx';
import { Button } from '../ui';

export function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const iniciales = user ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase() : '—';

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mostrar u ocultar el menú lateral"
          className="hidden rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink md:block"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="text-sm text-ink-muted">Flowy · ERP</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-ink">
            {iniciales}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-ink">
              {user ? `${user.nombre} ${user.apellido}` : 'Invitado'}
            </p>
            <p className="text-xs text-ink-soft">{user?.rol?.nombre}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          Salir
        </Button>
      </div>
    </header>
  );
}
