import { Router } from 'express';
import { libroController } from '../controllers/libro.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateQuery } from '../middleware/validate.js';
import { libroDiarioQuerySchema, libroMayorQuerySchema } from '../validators/libro.validators.js';

const router = Router();

// Ambos endpoints requieren autenticación y rol CONTADOR o GERENTE.
router.use(requireAuth, authorizeRoles('CONTADOR', 'GERENTE'));

router.get('/diario', validateQuery(libroDiarioQuerySchema), libroController.getLibroDiario);
router.get('/mayor', validateQuery(libroMayorQuerySchema), libroController.getLibroMayor);

export default router;
