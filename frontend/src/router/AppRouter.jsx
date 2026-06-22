import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { Login } from '../pages/Login.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { Cuentas } from '../pages/Cuentas.jsx';
import { Asientos } from '../pages/Asientos.jsx';
import { Placeholder } from '../pages/Placeholder.jsx';

// Roles con acceso al módulo de Contabilidad.
const CONTABLES = ['CONTADOR', 'GERENTE'];

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <ProtectedRoute roles={CONTABLES}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'cuentas', element: <Cuentas /> },
      { path: 'asientos', element: <Asientos /> },
      { path: 'libro-diario', element: <Placeholder title="Libro Diario" etapa="Etapa 5" /> },
      { path: 'libro-mayor', element: <Placeholder title="Libro Mayor" etapa="Etapa 5" /> },
      { path: 'estados', element: <Placeholder title="Estados financieros" etapa="Etapa 6" /> },
      { path: 'cierres', element: <Placeholder title="Cierre de gestión" etapa="Etapa 7" /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
