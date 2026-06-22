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

// Crear y cambiar estado: solo CONTADOR.
router.post('/', authorizeRoles('CONTADOR'), validateBody(crearAsientoSchema), asientoController.crear);
router.post('/:id/confirmar', authorizeRoles('CONTADOR'), asientoController.confirmar);
router.post('/:id/anular', authorizeRoles('CONTADOR'), asientoController.anular);

export default router;
