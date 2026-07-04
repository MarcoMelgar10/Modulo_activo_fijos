import { Router } from 'express';
import { cuentaPorPagarController } from '../controllers/cuenta-por-pagar.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { registrarPagoSchema } from '../validators/cuenta-por-pagar.validators.js';

const router = Router();

// Módulo de Compras: rol BODEGUERO (y GERENTE que ve todo).
router.use(requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'));

router.get('/', cuentaPorPagarController.listar);
router.get('/:id', cuentaPorPagarController.obtener);
router.post('/:id/pagos', validateBody(registrarPagoSchema), cuentaPorPagarController.registrarPago);

export default router;
