import { Router } from 'express';
import { presupuestoController } from '../controllers/presupuesto.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import {
  crearPresupuestoSchema,
  actualizarPresupuestoSchema,
  rechazarPresupuestoSchema,
} from '../validators/presupuesto.validators.js';

const router = Router();

// Consulta y definición: CONTADOR y GERENTE.
router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/', presupuestoController.listar);
router.get('/:id', presupuestoController.obtener);
router.get('/:id/ejecucion', presupuestoController.ejecucion);

// Definición (RF-PRE-01): crear/editar en BORRADOR.
router.post('/', validateBody(crearPresupuestoSchema), presupuestoController.crear);
router.put('/:id', validateBody(actualizarPresupuestoSchema), presupuestoController.actualizar);

// Aprobación (RF-PRE-02): solo GERENTE.
router.post('/:id/aprobar', authorizeRoles('GERENTE'), presupuestoController.aprobar);
router.post('/:id/rechazar', authorizeRoles('GERENTE'), validateBody(rechazarPresupuestoSchema), presupuestoController.rechazar);

export default router;
