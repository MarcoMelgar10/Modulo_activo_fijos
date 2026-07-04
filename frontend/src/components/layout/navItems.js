import { ACCESO } from '../../lib/access.js';

// Navegación del ERP. Cada ítem declara los roles que pueden verlo (RF-USR-02).
export const navItems = [
  { to: '/', label: 'Dashboard', section: 'General', roles: ACCESO.CONTABILIDAD },

  { to: '/punto-venta', label: 'Punto de venta', section: 'Ventas', roles: ACCESO.VENTAS },
  { to: '/ventas', label: 'Historial de ventas', section: 'Ventas', roles: ACCESO.VENTAS },
  { to: '/reporte-ventas', label: 'Reporte de ventas', section: 'Ventas', roles: ACCESO.VENTAS },

  { to: '/proveedores', label: 'Proveedores', section: 'Compras', roles: ACCESO.COMPRAS },
  { to: '/ordenes-compra', label: 'Órdenes de compra', section: 'Compras', roles: ACCESO.COMPRAS },
  { to: '/cuentas-por-pagar', label: 'Cuentas por pagar', section: 'Compras', roles: ACCESO.COMPRAS },

  { to: '/productos', label: 'Productos', section: 'Inventario', roles: ACCESO.INVENTARIO },
  { to: '/inventario', label: 'Inventario por sucursal', section: 'Inventario', roles: ACCESO.INVENTARIO },
  { to: '/traspasos', label: 'Traspasos', section: 'Inventario', roles: ACCESO.TRASPASOS },

  { to: '/presupuestos', label: 'Presupuestos', section: 'Presupuesto', roles: ACCESO.PRESUPUESTO },
  { to: '/ejecucion-presupuesto', label: 'Ejecución presupuestaria', section: 'Presupuesto', roles: ACCESO.PRESUPUESTO },

  { to: '/cuentas', label: 'Plan de cuentas', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD },
  { to: '/asientos', label: 'Asientos', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD },
  { to: '/simulador-erp', label: 'Simulador ERP', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD },
  { to: '/cierres', label: 'Cierre de gestión', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD },

  { to: '/libro-diario', label: 'Libro Diario', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/libro-mayor', label: 'Libro Mayor', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/balance-general', label: 'Balance General', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/estado-resultados', label: 'Estado de Resultados', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/libro-compras', label: 'Libro de Compras', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/libro-ventas', label: 'Libro de Ventas', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },
  { to: '/flujo-caja', label: 'Flujo de Caja', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD },

  { to: '/usuarios', label: 'Usuarios', section: 'Administración', roles: ACCESO.USUARIOS },
  { to: '/auditoria', label: 'Auditoría', section: 'Administración', roles: ACCESO.USUARIOS },
  { to: '/sucursales', label: 'Sucursales', section: 'Administración', roles: ACCESO.SUCURSALES },
];
