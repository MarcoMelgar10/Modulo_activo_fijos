import { asyncHandler } from '../utils/asyncHandler.js';
import { traspasoService } from '../services/traspaso.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const traspasoController = {
  listar: asyncHandler(async (req, res) => {
    const traspasos = await traspasoService.listar(req.user);
    res.json({ traspasos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const traspaso = await traspasoService.obtener(Number(req.params.id), req.user);
    res.json({ traspaso });
  }),

  crear: asyncHandler(async (req, res) => {
    const traspaso = await traspasoService.crear(req.body, req.user);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `CREAR_TRASPASO:${traspaso.id_traspaso}`, modulo: 'TRASPASOS',
    });
    res.status(201).json({ traspaso });
  }),

  enviar: asyncHandler(async (req, res) => {
    const traspaso = await traspasoService.enviar(Number(req.params.id), req.user);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `ENVIAR_TRASPASO:${traspaso.id_traspaso}`, modulo: 'TRASPASOS',
    });
    res.json({ traspaso });
  }),

  recibir: asyncHandler(async (req, res) => {
    const traspaso = await traspasoService.recibir(Number(req.params.id), req.body.fecha_recepcion, req.user);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `RECIBIR_TRASPASO:${traspaso.id_traspaso}`, modulo: 'TRASPASOS',
    });
    res.json({ traspaso });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const traspaso = await traspasoService.cancelar(Number(req.params.id), req.user);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `CANCELAR_TRASPASO:${traspaso.id_traspaso}`, modulo: 'TRASPASOS',
    });
    res.json({ traspaso });
  }),
};
