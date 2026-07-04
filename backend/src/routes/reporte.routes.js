import { Router } from 'express';
import { reporteController } from '../controllers/reporte.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateQuery } from '../middleware/validate.js';
import { reporteQuerySchema } from '../validators/reporte.validators.js';

const router = Router();

// Reportes financieros: solo CONTADOR y GERENTE.
router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/balance-general', validateQuery(reporteQuerySchema), reporteController.getBalanceGeneral);
router.get('/estado-resultados', validateQuery(reporteQuerySchema), reporteController.getEstadoResultados);
router.get('/flujo-caja', validateQuery(reporteQuerySchema), reporteController.getFlujoCaja);

export default router;
