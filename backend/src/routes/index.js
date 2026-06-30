import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cuentaRoutes from './cuenta.routes.js';
import asientoRoutes from './asiento.routes.js';
import eventoRoutes from './evento.routes.js';
import libroRoutes from './libro.routes.js';
import reporteRoutes from './reporte.routes.js';
import cierreRoutes from './cierre.routes.js';

const router = Router();

// Agregador de rutas de la API (montado en /api).
//   /eventos-contables (Etapa 4), /libros (Etapa 5), /reportes (Etapa 6), /cierres (Etapa 7)
router.get('/', (req, res) => res.json({ name: 'Contabilidad API', version: '0.1.0' }));

router.use('/auth', authRoutes);
router.use('/cuentas', cuentaRoutes);
router.use('/asientos', asientoRoutes);
router.use('/eventos-contables', eventoRoutes);
router.use('/libros', libroRoutes);
router.use('/reportes', reporteRoutes);
router.use('/cierres', cierreRoutes);

export default router;
