// Control de acceso por rol (RF-USR-02). El GERENTE (administrador) ve todos los
// módulos; los demás roles, definidos en el seeder, ven solo su especialidad.
export const ACCESO = {
  CONTABILIDAD: ['GERENTE', 'CONTADOR'],
  VENTAS: ['GERENTE', 'CAJERO'],
  COMPRAS: ['GERENTE', 'BODEGUERO'],
  INVENTARIO: ['GERENTE', 'BODEGUERO'],
  PRESUPUESTO: ['GERENTE', 'CONTADOR'],
  USUARIOS: ['GERENTE'],
  SUCURSALES: ['GERENTE'],
  TRASPASOS: ['GERENTE', 'BODEGUERO'],
  BIOMETRIA: ['GERENTE', 'BODEGUERO'],
};

// Página inicial según el rol (a dónde llega tras iniciar sesión).
export function homePathFor(rol) {
  if (rol === 'CAJERO') return '/punto-venta';
  if (rol === 'BODEGUERO') return '/productos';
  return '/'; // GERENTE y CONTADOR → Dashboard
}
