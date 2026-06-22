import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cuentaRoutes from './cuenta.routes.js';
import asientoRoutes from './asiento.routes.js';

const router = Router();

// Agregador de rutas de la API (montado en /api).
// Cada módulo registra aquí su router. Se irán sumando por etapa:
//   /eventos-contables (Etapa 4), /reportes (Etapa 5-6), /cierres (Etapa 7)
router.get('/', (req, res) => res.json({ name: 'Contabilidad API', version: '0.1.0' }));

router.use('/auth', authRoutes);
router.use('/cuentas', cuentaRoutes);
router.use('/asientos', asientoRoutes);

export default router;
