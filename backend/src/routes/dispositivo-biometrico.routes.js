import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearDispositivoSchema, actualizarDispositivoSchema, cambiarEstadoDispositivoSchema } from '../validators/acceso-biometrico.validators.js';
import { dispositivoBiometricoController } from '../controllers/dispositivo-biometrico.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', authorizeRoles('GERENTE', 'BODEGUERO'), dispositivoBiometricoController.listar);
router.get('/:id', authorizeRoles('GERENTE', 'BODEGUERO'), dispositivoBiometricoController.obtener);
router.post('/', authorizeRoles('GERENTE'), validateBody(crearDispositivoSchema), dispositivoBiometricoController.crear);
router.put('/:id', authorizeRoles('GERENTE'), validateBody(actualizarDispositivoSchema), dispositivoBiometricoController.actualizar);
router.post('/:id/estado', authorizeRoles('GERENTE'), validateBody(cambiarEstadoDispositivoSchema), dispositivoBiometricoController.cambiarEstado);

export default router;
