// Control de acceso por rol (RF-USR-02). El GERENTE (administrador) ve todos los
// módulos; los demás roles, definidos en el seeder, ven solo su especialidad.
export const ACCESO = {
  GENERAL: ['GERENTE', 'CONTADOR', 'CAJERO', 'BODEGUERO'],
  CONTABILIDAD: ['GERENTE', 'CONTADOR'],
  VENTAS: ['GERENTE', 'CAJERO'],
  COMPRAS: ['GERENTE', 'BODEGUERO'],
  INVENTARIO: ['GERENTE', 'BODEGUERO'],
  PRESUPUESTO: ['GERENTE', 'CONTADOR'],
  USUARIOS: ['GERENTE'],
};

// Página inicial: todos los roles aterrizan en el panel principal, cuyo
// contenido (KPIs y menú de módulos) se adapta al perfil.
export function homePathFor() {
  return '/';
}
