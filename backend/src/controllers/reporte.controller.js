import { asyncHandler } from '../utils/asyncHandler.js';
import { reporteService } from '../services/reporte.service.js';
import { auditService } from '../services/audit.service.js';
import { logger } from '../config/logger.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const reporteController = {
  getBalanceGeneral: asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    logger.info('Consulta Balance General', { fecha_inicio, fecha_fin, id_sucursal, usuario: req.user?.id });

    const resultado = await reporteService.generarBalanceGeneral({ fecha_inicio, fecha_fin, id_sucursal });

    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CONSULTA_BALANCE_GENERAL:${fecha_inicio}_${fecha_fin}`,
      modulo: 'CONTABILIDAD',
    });

    res.json(resultado);
  }),

  getEstadoResultados: asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    logger.info('Consulta Estado de Resultados', { fecha_inicio, fecha_fin, id_sucursal, usuario: req.user?.id });

    const resultado = await reporteService.generarEstadoResultados({ fecha_inicio, fecha_fin, id_sucursal });

    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CONSULTA_ESTADO_RESULTADOS:${fecha_inicio}_${fecha_fin}`,
      modulo: 'CONTABILIDAD',
    });

    res.json(resultado);
  }),

  getFlujoCaja: asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const resultado = await reporteService.generarFlujoCaja({ fecha_inicio, fecha_fin });

    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CONSULTA_FLUJO_CAJA:${fecha_inicio}_${fecha_fin}`,
      modulo: 'CONTABILIDAD',
    });

    res.json(resultado);
  }),
};
