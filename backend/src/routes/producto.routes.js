import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateBody } from '../middleware/validate.js';
import {
  crearProductoSchema,
  actualizarProductoSchema,
  crearCategoriaSchema,
} from '../validators/producto.validators.js';

const router = Router();

router.use(requireAuth);

// Lectura del catálogo: BODEGUERO (gestión) + CAJERO (POS) + GERENTE.
const puedeLeer = authorizeRoles('GERENTE', 'BODEGUERO', 'CAJERO');
// Escritura del catálogo: BODEGUERO + GERENTE (módulo Inventario).
const puedeEscribir = authorizeRoles('GERENTE', 'BODEGUERO');

// Categorías.
router.get('/categorias', puedeLeer, productoController.listarCategorias);
router.post('/categorias', puedeEscribir, validateBody(crearCategoriaSchema), productoController.crearCategoria);

// Productos (CRUD completo).
router.get('/', puedeLeer, productoController.listar);
router.get('/:id', puedeLeer, productoController.obtener);
router.post('/', puedeEscribir, validateBody(crearProductoSchema), productoController.crear);
router.put('/:id', puedeEscribir, validateBody(actualizarProductoSchema), productoController.actualizar);
router.delete('/:id', puedeEscribir, productoController.eliminar);

export default router;
