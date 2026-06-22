import { ApiError } from '../utils/ApiError.js';
import { tokenService } from '../services/token.service.js';

/**
 * Verifica el JWT Bearer y que la sesión siga activa en Redis (permite logout/
 * revocación). Adjunta el usuario decodificado en req.user.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Token no provisto');
    }

    let payload;
    try {
      payload = tokenService.verify(token);
    } catch {
      throw ApiError.unauthorized('Token inválido o expirado');
    }

    if (!(await tokenService.isSessionActive(payload.jti))) {
      throw ApiError.unauthorized('Sesión finalizada');
    }

    req.user = {
      id: payload.sub,
      usuario: payload.usuario,
      rol: payload.rol,
      id_sucursal: payload.id_sucursal,
      jti: payload.jti,
    };
    next();
  } catch (err) {
    next(err);
  }
}
