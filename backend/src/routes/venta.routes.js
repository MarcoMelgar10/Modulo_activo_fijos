import { Router } from 'express';
import { ventaController } from '../controllers/venta.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearVentaSchema, crearDevolucionSchema } from '../validators/venta.validators.js';

const router = Router();

// Módulo de Ventas/POS: rol CAJERO (y GERENTE que ve todo).
router.use(requireAuth, authorizeRoles('GERENTE', 'CAJERO'));

router.get('/', ventaController.listar);
router.get('/reporte', ventaController.reporte);
router.get('/:id', ventaController.obtener);
router.post('/', validateBody(crearVentaSchema), ventaController.crear);
router.post('/devoluciones', validateBody(crearDevolucionSchema), ventaController.devolver);

export default router;
