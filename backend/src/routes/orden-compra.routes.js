import { Router } from 'express';
import { ordenCompraController } from '../controllers/orden-compra.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearOrdenSchema, recibirOrdenSchema } from '../validators/orden-compra.validators.js';

const router = Router();

// Módulo de Compras: rol BODEGUERO (y GERENTE que ve todo).
router.use(requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'));

router.get('/', ordenCompraController.listar);
router.get('/:id', ordenCompraController.obtener);
router.post('/', validateBody(crearOrdenSchema), ordenCompraController.crear);
router.post('/:id/enviar', ordenCompraController.enviar);
router.post('/:id/recibir', validateBody(recibirOrdenSchema), ordenCompraController.recibir);
router.post('/:id/cancelar', ordenCompraController.cancelar);

export default router;
