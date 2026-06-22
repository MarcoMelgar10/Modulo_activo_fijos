import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { Button, Input, Card, CardBody } from '../components/ui';

export function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  if (!loading && isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            F
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Flowy · Contabilidad</h1>
          <p className="mt-1 text-sm text-ink-muted">Inicia sesión para continuar</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                id="usuario"
                label="Usuario"
                autoComplete="username"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                placeholder="contador"
                required
              />
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
