import { asyncHandler } from '../utils/asyncHandler.js';
import { proveedorService } from '../services/proveedor.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const proveedorController = {
  listar: asyncHandler(async (req, res) => {
    const activo = req.query.activo === undefined ? undefined : req.query.activo === 'true';
    const proveedores = await proveedorService.listar({ activo });
    res.json({ proveedores });
  }),

  obtener: asyncHandler(async (req, res) => {
    const proveedor = await proveedorService.obtener(Number(req.params.id));
    res.json({ proveedor });
  }),

  crear: asyncHandler(async (req, res) => {
    const proveedor = await proveedorService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_PROVEEDOR:${proveedor.nit}`,
      modulo: 'COMPRAS',
    });
    res.status(201).json({ proveedor });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const proveedor = await proveedorService.actualizar(Number(req.params.id), req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EDITAR_PROVEEDOR:${proveedor.nit}`,
      modulo: 'COMPRAS',
    });
    res.json({ proveedor });
  }),

  eliminar: asyncHandler(async (req, res) => {
    await proveedorService.eliminar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `BAJA_PROVEEDOR:${req.params.id}`,
      modulo: 'COMPRAS',
    });
    res.status(204).send();
  }),
};
