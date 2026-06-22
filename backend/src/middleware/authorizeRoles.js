import { ApiError } from '../utils/ApiError.js';

/**
 * RBAC (RNF-05): restringe el acceso a los roles indicados. Debe usarse después
 * de requireAuth. Ej: router.get('/x', requireAuth, authorizeRoles('CONTADOR'))
 */
export const authorizeRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.rol)) {
      return next(ApiError.forbidden('No tiene permisos para esta acción'));
    }
    next();
  };
