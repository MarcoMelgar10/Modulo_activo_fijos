import { asyncHandler } from '../utils/asyncHandler.js';
import { productoService } from '../services/producto.service.js';
import { categoriaService } from '../services/categoria.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const productoController = {
  // ---- Categorías ----
  listarCategorias: asyncHandler(async (req, res) => {
    const categorias = await categoriaService.listar();
    res.json({ categorias });
  }),

  crearCategoria: asyncHandler(async (req, res) => {
    const categoria = await categoriaService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_CATEGORIA:${categoria.nombre}`,
      modulo: 'INVENTARIO',
    });
    res.status(201).json({ categoria });
  }),

  // ---- Productos ----
  listar: asyncHandler(async (req, res) => {
    const activo = req.query.activo === undefined ? undefined : req.query.activo === 'true';
    const id_categoria = req.query.id_categoria ? Number(req.query.id_categoria) : undefined;
    const productos = await productoService.listar({ activo, id_categoria });
    res.json({ productos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const producto = await productoService.obtener(Number(req.params.id));
    res.json({ producto });
  }),

  crear: asyncHandler(async (req, res) => {
    const producto = await productoService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_PRODUCTO:${producto.codigo_barras}`,
      modulo: 'INVENTARIO',
    });
    res.status(201).json({ producto });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const producto = await productoService.actualizar(Number(req.params.id), req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EDITAR_PRODUCTO:${producto.codigo_barras}`,
      modulo: 'INVENTARIO',
    });
    res.json({ producto });
  }),

  eliminar: asyncHandler(async (req, res) => {
    await productoService.eliminar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `BAJA_PRODUCTO:${req.params.id}`,
      modulo: 'INVENTARIO',
    });
    res.status(204).send();
  }),
};
