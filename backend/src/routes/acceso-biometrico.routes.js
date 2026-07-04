import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { simularAccesoSchema, listarAccesosQuery } from '../validators/acceso-biometrico.validators.js';
import { accesoBiometricoController } from '../controllers/acceso-biometrico.controller.js';

const router = Router();

router.get('/', requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'), validateQuery(listarAccesosQuery), accesoBiometricoController.listar);
router.get('/:id', requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'), accesoBiometricoController.obtener);
router.post('/eventos', accesoBiometricoController.registrarEvento);
router.post('/simular', requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'), validateBody(simularAccesoSchema), accesoBiometricoController.simular);

export default router;
