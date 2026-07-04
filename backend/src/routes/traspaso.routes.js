import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearTraspasoSchema, recibirTraspasoSchema, cancelarTraspasoSchema } from '../validators/traspaso.validators.js';
import { traspasoController } from '../controllers/traspaso.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', authorizeRoles('GERENTE', 'BODEGUERO'), traspasoController.listar);
router.get('/:id', authorizeRoles('GERENTE', 'BODEGUERO'), traspasoController.obtener);
router.post('/', authorizeRoles('GERENTE', 'BODEGUERO'), validateBody(crearTraspasoSchema), traspasoController.crear);
router.post('/:id/enviar', authorizeRoles('GERENTE', 'BODEGUERO'), traspasoController.enviar);
router.post('/:id/recibir', authorizeRoles('GERENTE', 'BODEGUERO'), validateBody(recibirTraspasoSchema), traspasoController.recibir);
router.post('/:id/cancelar', authorizeRoles('GERENTE', 'BODEGUERO'), validateBody(cancelarTraspasoSchema), traspasoController.cancelar);

export default router;
