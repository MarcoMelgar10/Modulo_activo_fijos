import { Link } from 'react-router-dom';
import { PageHeader, EmptyState } from '../components/ui';
import { SectionIcon } from '../components/layout/SectionIcon.jsx';
import { modulesFor } from '../components/layout/navItems.js';
import { useAuth } from '../store/AuthContext.jsx';

// Menú principal: lo único que se ve al iniciar sesión. Muestra los módulos a los
// que el usuario puede ingresar según su rol (RF-USR-02). Al entrar a un módulo se
// listan sus funciones.
export function ModulosMenu() {
  const { user } = useAuth();
  const rol = user?.rol?.nombre;
  const modulos = modulesFor(rol);

  return (
    <div>
      <PageHeader
        title={`Hola, ${user?.nombre ?? ''}`.trim() || 'Bienvenido'}
        description="Selecciona un módulo para ver sus funciones."
      />

      {modulos.length === 0 ? (
        <EmptyState
          title="Sin módulos disponibles"
          description="Tu perfil no tiene módulos habilitados. Contacta al administrador."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map(({ section, slug, items }) => (
            <Link
              key={slug}
              to={`/m/${slug}`}
              className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent-300 hover:bg-surface-sunken"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-accent-600 group-hover:bg-surface">
                <SectionIcon name={section} className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink">{section}</h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {items.length} {items.length === 1 ? 'función' : 'funciones'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
