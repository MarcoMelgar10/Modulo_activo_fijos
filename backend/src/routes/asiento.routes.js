import { Router } from 'express';
import { asientoController } from '../controllers/asiento.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearAsientoSchema } from '../validators/asiento.validators.js';

const router = Router();

router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/', asientoController.listar);
router.get('/:id', asientoController.obtener);

// Crear y cambiar estado: CONTADOR (y GERENTE, que puede todo).
router.post('/', authorizeRoles('CONTADOR', 'GERENTE'), validateBody(crearAsientoSchema), asientoController.crear);
router.post('/:id/confirmar', authorizeRoles('CONTADOR', 'GERENTE'), asientoController.confirmar);
router.post('/:id/anular', authorizeRoles('CONTADOR', 'GERENTE'), asientoController.anular);

export default router;
