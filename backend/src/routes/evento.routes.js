import { Router } from 'express';
import { eventoController } from '../controllers/evento.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import { eventoContableSchema } from '../validators/evento.validators.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  authorizeRoles('CONTADOR', 'GERENTE'),
  validateBody(eventoContableSchema),
  eventoController.procesar,
);

export default router;
