import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cuentaRoutes from './cuenta.routes.js';
import asientoRoutes from './asiento.routes.js';
import eventoRoutes from './evento.routes.js';
import libroRoutes from './libro.routes.js';
import reporteRoutes from './reporte.routes.js';
import cierreRoutes from './cierre.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import libroFiscalRoutes from './libro-fiscal.routes.js';
import proveedorRoutes from './proveedor.routes.js';
import productoRoutes from './producto.routes.js';
import ordenCompraRoutes from './orden-compra.routes.js';
import cuentaPorPagarRoutes from './cuenta-por-pagar.routes.js';
import ventaRoutes from './venta.routes.js';
import usuarioRoutes from './usuario.routes.js';
import auditoriaRoutes from './auditoria.routes.js';
import presupuestoRoutes from './presupuesto.routes.js';

const router = Router();

// Agregador de rutas de la API (montado en /api).
//   /eventos-contables (Etapa 4), /libros (Etapa 5), /reportes (Etapa 6), /cierres (Etapa 7)
//   /proveedores, /productos, /ordenes-compra, /cuentas-por-pagar (Compras y Proveedores, RF-COM)
router.get('/', (req, res) => res.json({ name: 'Contabilidad API', version: '0.1.0' }));

router.use('/auth', authRoutes);
router.use('/cuentas', cuentaRoutes);
router.use('/asientos', asientoRoutes);
router.use('/eventos-contables', eventoRoutes);
router.use('/libros', libroRoutes);
router.use('/reportes', reporteRoutes);
router.use('/cierres', cierreRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/libros-fiscales', libroFiscalRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/productos', productoRoutes);
router.use('/ordenes-compra', ordenCompraRoutes);
router.use('/cuentas-por-pagar', cuentaPorPagarRoutes);
router.use('/ventas', ventaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/presupuestos', presupuestoRoutes);

export default router;
