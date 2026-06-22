import { asyncHandler } from '../utils/asyncHandler.js';
import { cuentaService } from '../services/cuenta.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const cuentaController = {
  listar: asyncHandler(async (req, res) => {
    const cuentas = await cuentaService.listar();
    res.json({ cuentas });
  }),

  arbol: asyncHandler(async (req, res) => {
    const arbol = await cuentaService.arbol();
    res.json({ arbol });
  }),

  obtener: asyncHandler(async (req, res) => {
    const cuenta = await cuentaService.obtener(Number(req.params.id));
    res.json({ cuenta });
  }),

  crear: asyncHandler(async (req, res) => {
    const cuenta = await cuentaService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_CUENTA:${cuenta.codigo}`,
      modulo: 'CONTABILIDAD',
    });
    res.status(201).json({ cuenta });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const cuenta = await cuentaService.actualizar(Number(req.params.id), req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EDITAR_CUENTA:${cuenta.codigo}`,
      modulo: 'CONTABILIDAD',
    });
    res.json({ cuenta });
  }),

  eliminar: asyncHandler(async (req, res) => {
    await cuentaService.eliminar(Number(req.params.id));
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `ELIMINAR_CUENTA:${req.params.id}`,
      modulo: 'CONTABILIDAD',
    });
    res.status(204).send();
  }),
};
