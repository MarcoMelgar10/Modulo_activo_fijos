import { useAuth } from '../../store/AuthContext.jsx';
import { Button } from '../ui';

export function Topbar() {
  const { user, logout } = useAuth();
  const iniciales = user ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase() : '—';

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <div className="text-sm text-ink-muted">Flowy · ERP</div>
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
