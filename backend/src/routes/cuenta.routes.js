import { Router } from 'express';
import { cuentaController } from '../controllers/cuenta.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearCuentaSchema, actualizarCuentaSchema } from '../validators/cuenta.validators.js';

const router = Router();

// Todo el módulo de contabilidad requiere sesión y rol contable.
router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/', cuentaController.listar);
router.get('/arbol', cuentaController.arbol);
router.get('/:id', cuentaController.obtener);

// Crear/editar/eliminar: CONTADOR (y GERENTE, que puede todo).
router.post('/', authorizeRoles('CONTADOR', 'GERENTE'), validateBody(crearCuentaSchema), cuentaController.crear);
router.put('/:id', authorizeRoles('CONTADOR', 'GERENTE'), validateBody(actualizarCuentaSchema), cuentaController.actualizar);
router.delete('/:id', authorizeRoles('CONTADOR', 'GERENTE'), cuentaController.eliminar);

export default router;
