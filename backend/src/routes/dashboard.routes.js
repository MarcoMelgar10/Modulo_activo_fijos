import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateQuery } from '../middleware/validate.js';
import { dashboardQuerySchema } from '../validators/dashboard.validators.js';
import { dashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  authorizeRoles('CONTADOR', 'GERENTE'),
  validateQuery(dashboardQuerySchema),
  dashboardController.obtenerKPIs,
);

// Dashboard gerencial (RF-REP-01): KPIs en tiempo real, solo GERENTE.
router.get('/gerencial', requireAuth, authorizeRoles('GERENTE'), dashboardController.gerencial);

export default router;
