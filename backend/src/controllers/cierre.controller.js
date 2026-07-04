import { asyncHandler } from '../utils/asyncHandler.js';
import { cierreService } from '../services/cierre.service.js';
import { auditService } from '../services/audit.service.js';

const clientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const cierreController = {
  listar: asyncHandler(async (req, res) => {
    const cierres = await cierreService.listar();
    res.json({ cierres });
  }),

  obtener: asyncHandler(async (req, res) => {
    const cierre = await cierreService.obtener(Number(req.params.id));
    res.json({ cierre });
  }),

  cerrar: asyncHandler(async (req, res) => {
    const { anio } = req.body;
    const resultado = await cierreService.cerrarPeriodo({
      anio,
      idEmpleado: req.user.id,
      idSucursal: req.user.id_sucursal,
    });
    await auditService.log({
      idEmpleado: req.user.id,
      ip: clientIp(req),
      accion: `CERRAR_GESTION:${anio}`,
      modulo: 'CONTABILIDAD',
    });
    res.status(201).json(resultado);
  }),
};
