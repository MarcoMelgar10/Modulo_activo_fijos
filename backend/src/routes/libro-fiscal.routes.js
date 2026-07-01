import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateQuery } from '../middleware/validate.js';
import { libroFiscalQuerySchema } from '../validators/libro-fiscal.validators.js';
import { libroFiscalController } from '../controllers/libro-fiscal.controller.js';

const router = Router();

router.get(
  '/compras',
  requireAuth,
  authorizeRoles('CONTADOR', 'GERENTE'),
  validateQuery(libroFiscalQuerySchema),
  libroFiscalController.obtenerCompras,
);

router.get(
  '/ventas',
  requireAuth,
  authorizeRoles('CONTADOR', 'GERENTE'),
  validateQuery(libroFiscalQuerySchema),
  libroFiscalController.obtenerVentas,
);

export default router;
