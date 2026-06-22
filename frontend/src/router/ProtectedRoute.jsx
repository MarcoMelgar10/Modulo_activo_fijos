import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { Spinner } from '../components/ui';

/**
 * Protege rutas: exige sesión activa y, opcionalmente, uno de los roles dados.
 */
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user?.rol?.nombre)) {
    return (
      <div className="flex h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold text-ink">Acceso restringido</p>
          <p className="mt-1 text-sm text-ink-muted">
            Tu rol no tiene permisos para ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
