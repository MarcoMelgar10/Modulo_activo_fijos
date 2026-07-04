import { Router } from 'express';
import { cierreController } from '../controllers/cierre.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { cerrarGestionSchema } from '../validators/cierre.validators.js';

const router = Router();

router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/', cierreController.listar);
router.get('/:id', cierreController.obtener);

// Cerrar gestión: CONTADOR (y GERENTE, que puede todo).
router.post('/', authorizeRoles('CONTADOR', 'GERENTE'), validateBody(cerrarGestionSchema), cierreController.cerrar);

export default router;
