import { asyncHandler } from '../utils/asyncHandler.js';
import { presupuestoService } from '../services/presupuesto.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const presupuestoController = {
  listar: asyncHandler(async (req, res) => {
    const { gestion, estado } = req.query;
    const presupuestos = await presupuestoService.listar({
      gestion: gestion ? Number(gestion) : undefined,
      estado,
    });
    res.json({ presupuestos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const presupuesto = await presupuestoService.obtener(Number(req.params.id));
    res.json({ presupuesto });
  }),

  ejecucion: asyncHandler(async (req, res) => {
    const ejecucion = await presupuestoService.ejecucion(Number(req.params.id));
    res.json(ejecucion);
  }),

  crear: asyncHandler(async (req, res) => {
    const presupuesto = await presupuestoService.crear(req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_PRESUPUESTO:${presupuesto.nombre}:${presupuesto.gestion}`,
      modulo: 'PRESUPUESTO',
    });
    res.status(201).json({ presupuesto });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const presupuesto = await presupuestoService.actualizar(Number(req.params.id), req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EDITAR_PRESUPUESTO:${presupuesto.id_presupuesto}`,
      modulo: 'PRESUPUESTO',
    });
    res.json({ presupuesto });
  }),

  aprobar: asyncHandler(async (req, res) => {
    const presupuesto = await presupuestoService.aprobar(Number(req.params.id), req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `APROBAR_PRESUPUESTO:${presupuesto.id_presupuesto}:${presupuesto.gestion}`,
      modulo: 'PRESUPUESTO',
    });
    res.json({ presupuesto });
  }),

  rechazar: asyncHandler(async (req, res) => {
    const presupuesto = await presupuestoService.rechazar(Number(req.params.id), req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `RECHAZAR_PRESUPUESTO:${presupuesto.id_presupuesto}`,
      modulo: 'PRESUPUESTO',
    });
    res.json({ presupuesto });
  }),
};
