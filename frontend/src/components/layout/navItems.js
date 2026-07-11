import { ACCESO } from '../../lib/access.js';

// Orden de las secciones del ERP (compartido por el sidebar y el menú del panel principal).
export const navSections = [
  'General',
  'Ventas',
  'Compras',
  'Inventario',
  'Contabilidad',
  'Reportes Financieros',
  'Presupuesto',
  'Administración',
];

// Navegación del ERP. Cada ítem declara los roles que pueden verlo (RF-USR-02)
// y una descripción corta que se muestra en el menú del panel principal.
export const navItems = [
  { to: '/', label: 'Inicio', section: 'General', roles: ACCESO.GENERAL, desc: 'Menú de módulos' },
  { to: '/dashboard-gerencial', label: 'Dashboard gerencial', section: 'General', roles: ['GERENTE'], desc: 'KPIs del negocio en tiempo real' },

  { to: '/punto-venta', label: 'Punto de venta', section: 'Ventas', roles: ACCESO.VENTAS, desc: 'Registrar ventas (POS)' },
  { to: '/ventas', label: 'Historial de ventas', section: 'Ventas', roles: ACCESO.VENTAS, desc: 'Ventas y devoluciones' },
  { to: '/reporte-ventas', label: 'Reporte de ventas', section: 'Ventas', roles: ACCESO.VENTAS, desc: 'Totales y comparativa por sucursal' },

  { to: '/proveedores', label: 'Proveedores', section: 'Compras', roles: ACCESO.COMPRAS, desc: 'Directorio de proveedores' },
  { to: '/ordenes-compra', label: 'Órdenes de compra', section: 'Compras', roles: ACCESO.COMPRAS, desc: 'Emisión, envío y recepción' },
  { to: '/cuentas-por-pagar', label: 'Cuentas por pagar', section: 'Compras', roles: ACCESO.COMPRAS, desc: 'Deudas y pagos a proveedores' },

  { to: '/productos', label: 'Productos', section: 'Inventario', roles: ACCESO.INVENTARIO, desc: 'Catálogo y categorías' },

  { to: '/cuentas', label: 'Plan de cuentas', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD, desc: 'Árbol de cuentas contables' },
  { to: '/asientos', label: 'Asientos', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD, desc: 'Partida doble y estados' },
  { to: '/cierres', label: 'Cierre de gestión', section: 'Contabilidad', roles: ACCESO.CONTABILIDAD, desc: 'Cierre anual del período' },

  { to: '/libro-diario', label: 'Libro Diario', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'Movimientos del período' },
  { to: '/libro-mayor', label: 'Libro Mayor', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'Saldos por cuenta' },
  { to: '/balance-general', label: 'Balance General', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'Situación a una fecha' },
  { to: '/estado-resultados', label: 'Estado de Resultados', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'Ingresos, gastos y utilidad' },
  { to: '/libro-compras', label: 'Libro de Compras', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'IVA crédito fiscal (SIN)' },
  { to: '/libro-ventas', label: 'Libro de Ventas', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'IVA débito fiscal (SIN)' },
  { to: '/flujo-caja', label: 'Flujo de Caja', section: 'Reportes Financieros', roles: ACCESO.CONTABILIDAD, desc: 'Entradas y salidas de efectivo' },

  { to: '/presupuestos', label: 'Presupuestos', section: 'Presupuesto', roles: ACCESO.PRESUPUESTO, desc: 'Definición y aprobación' },
  { to: '/ejecucion-presupuesto', label: 'Ejecución presupuestaria', section: 'Presupuesto', roles: ACCESO.PRESUPUESTO, desc: 'Plan vs real y alertas' },

  { to: '/usuarios', label: 'Usuarios', section: 'Administración', roles: ACCESO.USUARIOS, desc: 'Altas, roles y estados' },
  { to: '/auditoria', label: 'Auditoría', section: 'Administración', roles: ACCESO.USUARIOS, desc: 'Registro de acciones del sistema' },
];

// Slug de sección para la ruta del menú de módulos (/m/:slug). Sin acentos ni espacios.
export function sectionSlug(section) {
  return section
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

// Sección a partir de su slug (o null si no existe).
export function sectionFromSlug(slug) {
  return navSections.find((s) => sectionSlug(s) === slug) ?? null;
}

// Funciones (ítems) de un módulo visibles para un rol. Excluye el propio Inicio
// (to === '/'), que es el menú de módulos, no una función de un módulo.
export function moduleItems(section, rol) {
  return navItems.filter(
    (item) =>
      item.section === section &&
      item.to !== '/' &&
      (!item.roles || item.roles.includes(rol)),
  );
}

// Módulos (secciones) que el rol puede ver, con sus funciones. Base del menú
// principal: solo aparece un módulo si tiene al menos una función accesible.
export function modulesFor(rol) {
  return navSections
    .map((section) => ({ section, slug: sectionSlug(section), items: moduleItems(section, rol) }))
    .filter((m) => m.items.length > 0);
}

// Módulo (sección) activo según la ruta. Determina cuándo se muestra la barra
// lateral y con qué funciones. `null` en el menú principal (sin barra lateral).
export function sectionForPath(pathname) {
  if (!pathname || pathname === '/') return null;
  const enModulo = pathname.match(/^\/m\/([^/]+)/);
  if (enModulo) return sectionFromSlug(enModulo[1]);
  const item = navItems.find((it) => it.to !== '/' && (it.to === pathname || pathname.startsWith(`${it.to}/`)));
  return item ? item.section : null;
}
