import { ApiError } from '../utils/ApiError.js';

/**
 * Valida `req.body` contra un esquema Zod. En error, responde 400 con detalles.
 * El objeto parseado (con defaults/coerción) reemplaza a req.body.
 */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      campo: i.path.join('.'),
      mensaje: i.message,
    }));
    return next(ApiError.badRequest('Datos inválidos', details));
  }
  req.body = result.data;
  next();
};

/**
 * Valida `req.query` contra un esquema Zod. En error, responde 400 con detalles.
 * El objeto parseado (con defaults/coerción) reemplaza a req.query.
 */
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      campo: i.path.join('.'),
      mensaje: i.message,
    }));
    return next(ApiError.badRequest('Parámetros de consulta inválidos', details));
  }
  req.query = result.data;
  next();
};
