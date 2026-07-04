import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  cambiarEstadoSchema,
} from '../validators/usuario.validators.js';

const router = Router();

// Gestión de usuarios: exclusiva del GERENTE (administrador).
router.use(requireAuth, authorizeRoles('GERENTE'));

router.get('/', usuarioController.listar);
router.get('/roles', usuarioController.roles);
router.get('/:id', usuarioController.obtener);
router.post('/', validateBody(crearUsuarioSchema), usuarioController.crear);
router.put('/:id', validateBody(actualizarUsuarioSchema), usuarioController.actualizar);
router.post('/:id/estado', validateBody(cambiarEstadoSchema), usuarioController.cambiarEstado);

export default router;
