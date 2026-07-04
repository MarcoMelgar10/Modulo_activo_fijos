import { Router } from 'express';
import { proveedorController } from '../controllers/proveedor.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { crearProveedorSchema, actualizarProveedorSchema } from '../validators/proveedor.validators.js';

const router = Router();

// Módulo de Compras: rol BODEGUERO (y GERENTE que ve todo).
router.use(requireAuth, authorizeRoles('GERENTE', 'BODEGUERO'));

router.get('/', proveedorController.listar);
router.get('/:id', proveedorController.obtener);
router.post('/', validateBody(crearProveedorSchema), proveedorController.crear);
router.put('/:id', validateBody(actualizarProveedorSchema), proveedorController.actualizar);
router.delete('/:id', proveedorController.eliminar);

export default router;
