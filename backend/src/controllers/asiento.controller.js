import { asyncHandler } from '../utils/asyncHandler.js';
import { asientoService } from '../services/asiento.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const asientoController = {
  listar: asyncHandler(async (req, res) => {
    const { desde, hasta, estado, tipo_origen } = req.query;
    const asientos = await asientoService.listar({ desde, hasta, estado, tipo_origen });
    res.json({ asientos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const asiento = await asientoService.obtener(Number(req.params.id));
    res.json({ asiento });
  }),

  crear: asyncHandler(async (req, res) => {
    const asiento = await asientoService.crear({ ...req.body, id_sucursal: req.user.id_sucursal ?? req.body.id_sucursal });
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_ASIENTO:${asiento.numero_asiento}`,
      modulo: 'CONTABILIDAD',
    });
    res.status(201).json({ asiento });
  }),

  confirmar: asyncHandler(async (req, res) => {
    const asiento = await asientoService.confirmar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CONFIRMAR_ASIENTO:${asiento.numero_asiento}`,
      modulo: 'CONTABILIDAD',
    });
    res.json({ asiento });
  }),

  anular: asyncHandler(async (req, res) => {
    const asiento = await asientoService.anular(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `ANULAR_ASIENTO:${asiento.numero_asiento}`,
      modulo: 'CONTABILIDAD',
    });
    res.json({ asiento });
  }),
};
