import { Router } from 'express';
import { auditoriaController } from '../controllers/auditoria.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = Router();

// Auditoría de acciones: accesible al GERENTE (RF-REP-03).
router.use(requireAuth, authorizeRoles('GERENTE'));

router.get('/', auditoriaController.listar);
router.get('/modulos', auditoriaController.modulos);

export default router;
