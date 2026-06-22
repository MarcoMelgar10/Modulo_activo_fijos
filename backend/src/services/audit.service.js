import { LogAuditoria } from '../models/index.js';
import { logger } from '../config/logger.js';

/**
 * Registra acciones críticas (RF-REP-03 / RNF-06). No bloquea el flujo: si el
 * registro falla, se loguea pero no se propaga el error al usuario.
 */
export const auditService = {
  async log({ idEmpleado = null, ip = null, accion, modulo }) {
    try {
      await LogAuditoria.create({
        id_empleado: idEmpleado,
        ip_address: ip,
        accion,
        modulo,
      });
    } catch (err) {
      logger.error('No se pudo registrar auditoría', { error: err.message, accion, modulo });
    }
  },
};
