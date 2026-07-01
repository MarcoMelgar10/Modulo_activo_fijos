import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { Login } from '../pages/Login.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { Cuentas } from '../pages/Cuentas.jsx';
import { Asientos } from '../pages/Asientos.jsx';
import { LibroDiario } from '../pages/LibroDiario.jsx';
import { LibroMayor } from '../pages/LibroMayor.jsx';
import { BalanceGeneral } from '../pages/BalanceGeneral.jsx';
import { EstadoResultados } from '../pages/EstadoResultados.jsx';
import { SimuladorEventos } from '../pages/SimuladorEventos.jsx';
import { Cierres } from '../pages/Cierres.jsx';
import { LibroCompras } from '../pages/LibroCompras.jsx';
import { LibroVentas } from '../pages/LibroVentas.jsx';

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
      { path: 'libro-diario', element: <LibroDiario /> },
      { path: 'libro-mayor', element: <LibroMayor /> },
      { path: 'balance-general', element: <BalanceGeneral /> },
      { path: 'estado-resultados', element: <EstadoResultados /> },
      { path: 'simulador-erp', element: <SimuladorEventos /> },
      { path: 'cierres', element: <Cierres /> },
      { path: 'libro-compras', element: <LibroCompras /> },
      { path: 'libro-ventas', element: <LibroVentas /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
