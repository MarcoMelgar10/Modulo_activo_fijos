import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateQuery } from '../middleware/validate.js';
import { listarLotesQuery, stockQuery } from '../validators/inventario.validators.js';
import { inventarioController } from '../controllers/inventario.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/lotes', authorizeRoles('GERENTE', 'BODEGUERO', 'CAJERO'), validateQuery(listarLotesQuery), inventarioController.listarLotes);
router.get('/stock', authorizeRoles('GERENTE', 'BODEGUERO', 'CAJERO'), validateQuery(stockQuery), inventarioController.getStock);
router.get('/productos/:id_producto/stock', authorizeRoles('GERENTE', 'BODEGUERO'), inventarioController.getStockProducto);

export default router;
