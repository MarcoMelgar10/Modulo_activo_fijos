import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/ui';
import { SectionIcon } from '../components/layout/SectionIcon.jsx';
import { sectionFromSlug, moduleItems } from '../components/layout/navItems.js';
import { useAuth } from '../store/AuthContext.jsx';

// Bienvenida del módulo: al entrar a un módulo NO se muestran botones de funciones.
// La barra lateral (habilitada por AppShell para esta ruta) contiene las funciones
// del módulo; desde ahí se navega.
export function ModuloDetalle() {
  const { slug } = useParams();
  const { user } = useAuth();
  const rol = user?.rol?.nombre;

  const section = sectionFromSlug(slug);
  const items = section ? moduleItems(section, rol) : [];

  if (!section || items.length === 0) {
    return (
      <div>
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          ← Volver al menú
        </Link>
        <EmptyState
          title="Módulo no disponible"
          description="Este módulo no existe o tu perfil no tiene acceso a sus funciones."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sunken text-accent-600">
        <SectionIcon name={section} className="h-8 w-8" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-ink">{section}</h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Elige una función del módulo en el menú lateral para comenzar.
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        {items.length} {items.length === 1 ? 'función disponible' : 'funciones disponibles'}
      </p>
    </div>
  );
}
