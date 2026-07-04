import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { ACCESO } from '../lib/access.js';
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
import { Proveedores } from '../pages/Proveedores.jsx';
import { Productos } from '../pages/Productos.jsx';
import { OrdenesCompra } from '../pages/OrdenesCompra.jsx';
import { CuentasPorPagar } from '../pages/CuentasPorPagar.jsx';
import { PuntoVenta } from '../pages/PuntoVenta.jsx';
import { Ventas } from '../pages/Ventas.jsx';
import { ReporteVentas } from '../pages/ReporteVentas.jsx';
import { Usuarios } from '../pages/Usuarios.jsx';
import { FlujoCaja } from '../pages/FlujoCaja.jsx';
import { Auditoria } from '../pages/Auditoria.jsx';
import { Presupuestos } from '../pages/Presupuestos.jsx';
import { EjecucionPresupuesto } from '../pages/EjecucionPresupuesto.jsx';
import { Sucursales } from '../pages/Sucursales.jsx';
import { Inventario } from '../pages/Inventario.jsx';
import { Traspasos } from '../pages/Traspasos.jsx';

// Guard por rol reutilizando ProtectedRoute.
const guard = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

// Landing según rol: Dashboard para GERENTE/CONTADOR; el resto va a su módulo.
function RoleHome() {
  const { user } = useAuth();
  const rol = user?.rol?.nombre;
  if (rol === 'CAJERO') return <Navigate to="/punto-venta" replace />;
  if (rol === 'BODEGUERO') return <Navigate to="/productos" replace />;
  return guard(<Dashboard />, ACCESO.CONTABILIDAD);
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleHome /> },

      // Ventas / POS (CAJERO + GERENTE)
      { path: 'punto-venta', element: guard(<PuntoVenta />, ACCESO.VENTAS) },
      { path: 'ventas', element: guard(<Ventas />, ACCESO.VENTAS) },
      { path: 'reporte-ventas', element: guard(<ReporteVentas />, ACCESO.VENTAS) },

      // Compras (BODEGUERO + GERENTE)
      { path: 'proveedores', element: guard(<Proveedores />, ACCESO.COMPRAS) },
      { path: 'ordenes-compra', element: guard(<OrdenesCompra />, ACCESO.COMPRAS) },
      { path: 'cuentas-por-pagar', element: guard(<CuentasPorPagar />, ACCESO.COMPRAS) },

      // Inventario (BODEGUERO + GERENTE)
      { path: 'productos', element: guard(<Productos />, ACCESO.INVENTARIO) },
      { path: 'inventario', element: guard(<Inventario />, ACCESO.INVENTARIO) },
      { path: 'traspasos', element: guard(<Traspasos />, ACCESO.TRASPASOS) },

      // Contabilidad y Reportes Financieros (CONTADOR + GERENTE)
      { path: 'cuentas', element: guard(<Cuentas />, ACCESO.CONTABILIDAD) },
      { path: 'asientos', element: guard(<Asientos />, ACCESO.CONTABILIDAD) },
      { path: 'simulador-erp', element: guard(<SimuladorEventos />, ACCESO.CONTABILIDAD) },
      { path: 'cierres', element: guard(<Cierres />, ACCESO.CONTABILIDAD) },
      { path: 'libro-diario', element: guard(<LibroDiario />, ACCESO.CONTABILIDAD) },
      { path: 'libro-mayor', element: guard(<LibroMayor />, ACCESO.CONTABILIDAD) },
      { path: 'balance-general', element: guard(<BalanceGeneral />, ACCESO.CONTABILIDAD) },
      { path: 'estado-resultados', element: guard(<EstadoResultados />, ACCESO.CONTABILIDAD) },
      { path: 'libro-compras', element: guard(<LibroCompras />, ACCESO.CONTABILIDAD) },
      { path: 'libro-ventas', element: guard(<LibroVentas />, ACCESO.CONTABILIDAD) },
      { path: 'flujo-caja', element: guard(<FlujoCaja />, ACCESO.CONTABILIDAD) },

      // Presupuesto (CONTADOR + GERENTE)
      { path: 'presupuestos', element: guard(<Presupuestos />, ACCESO.PRESUPUESTO) },
      { path: 'ejecucion-presupuesto', element: guard(<EjecucionPresupuesto />, ACCESO.PRESUPUESTO) },

      // Administración (GERENTE)
      { path: 'usuarios', element: guard(<Usuarios />, ACCESO.USUARIOS) },
      { path: 'auditoria', element: guard(<Auditoria />, ACCESO.USUARIOS) },
      { path: 'sucursales', element: guard(<Sucursales />, ACCESO.SUCURSALES) },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
