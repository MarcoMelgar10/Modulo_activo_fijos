import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearSucursalSchema, actualizarSucursalSchema, cambiarEstadoSchema } from '../validators/sucursal.validators.js';
import { sucursalController } from '../controllers/sucursal.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', authorizeRoles('GERENTE', 'CONTADOR', 'BODEGUERO', 'CAJERO'), sucursalController.listar);
router.get('/:id', authorizeRoles('GERENTE', 'CONTADOR', 'BODEGUERO', 'CAJERO'), sucursalController.obtener);
router.post('/', authorizeRoles('GERENTE'), validateBody(crearSucursalSchema), sucursalController.crear);
router.put('/:id', authorizeRoles('GERENTE'), validateBody(actualizarSucursalSchema), sucursalController.actualizar);
router.post('/:id/estado', authorizeRoles('GERENTE'), validateBody(cambiarEstadoSchema), sucursalController.cambiarEstado);

export default router;
