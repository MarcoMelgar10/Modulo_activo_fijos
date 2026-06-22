import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Errores de validación de Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Registro duplicado', details: err.errors?.map((e) => e.message) });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Datos inválidos', details: err.errors?.map((e) => e.message) });
  }

  logger.error('Error no controlado', { error: err.message, stack: err.stack });
  return res.status(500).json({ error: 'Error interno del servidor' });
}
