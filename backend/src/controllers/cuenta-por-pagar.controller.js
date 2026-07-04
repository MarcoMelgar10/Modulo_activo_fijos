import { asyncHandler } from '../utils/asyncHandler.js';
import { cuentaPorPagarService } from '../services/cuenta-por-pagar.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const cuentaPorPagarController = {
  listar: asyncHandler(async (req, res) => {
    const { estado, id_proveedor } = req.query;
    const cuentas = await cuentaPorPagarService.listar({
      estado,
      id_proveedor: id_proveedor ? Number(id_proveedor) : undefined,
    });
    res.json({ cuentas });
  }),

  obtener: asyncHandler(async (req, res) => {
    const cxp = await cuentaPorPagarService.obtener(Number(req.params.id));
    res.json({ cxp });
  }),

  registrarPago: asyncHandler(async (req, res) => {
    const cxp = await cuentaPorPagarService.registrarPago(Number(req.params.id), req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `PAGO_CXP:${cxp.id_cxp}:${cxp.estado}`,
      modulo: 'COMPRAS',
    });
    res.status(201).json({ cxp });
  }),
};
