import { asyncHandler } from '../utils/asyncHandler.js';
import { accountingService } from '../services/accounting.service.js';
import { auditService } from '../services/audit.service.js';
import { logger } from '../config/logger.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const eventoController = {
  procesar: asyncHandler(async (req, res) => {
    const asiento = await accountingService.procesarEvento(req.body);

    logger.info('Evento contable procesado', {
      tipo: req.body.tipo,
      referencia_id: req.body.referencia_id,
      asiento: asiento.numero_asiento,
    });

    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EVENTO_CONTABLE:${req.body.tipo}:${asiento.numero_asiento}`,
      modulo: 'CONTABILIDAD',
    });

    res.status(201).json({ asiento });
  }),
};
