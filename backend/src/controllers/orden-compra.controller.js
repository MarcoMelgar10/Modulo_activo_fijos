import { asyncHandler } from '../utils/asyncHandler.js';
import { ordenCompraService } from '../services/orden-compra.service.js';
import { auditService } from '../services/audit.service.js';
import { requireSucursalOperativa } from '../utils/sucursalScope.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const ordenCompraController = {
  listar: asyncHandler(async (req, res) => {
    const { estado, id_proveedor } = req.query;
    const ordenes = await ordenCompraService.listar({
      estado,
      id_proveedor: id_proveedor ? Number(id_proveedor) : undefined,
    });
    res.json({ ordenes });
  }),

  obtener: asyncHandler(async (req, res) => {
    const orden = await ordenCompraService.obtener(Number(req.params.id));
    res.json({ orden });
  }),

  crear: asyncHandler(async (req, res) => {
    const idSucursal = requireSucursalOperativa(req.user, req.body.id_sucursal);
    const orden = await ordenCompraService.crear({ ...req.body, id_sucursal: idSucursal }, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_ORDEN_COMPRA:${orden.numero_orden}`,
      modulo: 'COMPRAS',
    });
    res.status(201).json({ orden });
  }),

  enviar: asyncHandler(async (req, res) => {
    const orden = await ordenCompraService.enviar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `ENVIAR_ORDEN_COMPRA:${orden.numero_orden}`,
      modulo: 'COMPRAS',
    });
    res.json({ orden });
  }),

  recibir: asyncHandler(async (req, res) => {
    const orden = await ordenCompraService.recibir(Number(req.params.id), req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `RECIBIR_ORDEN_COMPRA:${orden.numero_orden}`,
      modulo: 'COMPRAS',
    });
    res.json({ orden });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const orden = await ordenCompraService.cancelar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CANCELAR_ORDEN_COMPRA:${orden.numero_orden}`,
      modulo: 'COMPRAS',
    });
    res.json({ orden });
  }),
};
