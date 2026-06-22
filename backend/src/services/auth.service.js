import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { empleadoRepository } from '../repositories/empleado.repository.js';
import { tokenService } from './token.service.js';
import { auditService } from './audit.service.js';

/**
 * Servicio de autenticación. Las dependencias se inyectan (DIP) para poder
 * probar la lógica de negocio con mocks, sin tocar la base de datos.
 */
export function createAuthService({
  repo = empleadoRepository,
  hasher = bcrypt,
  tokens = tokenService,
  audit = auditService,
  config = env.security,
} = {}) {
  function estaBloqueado(empleado) {
    return empleado.bloqueado_hasta && new Date(empleado.bloqueado_hasta) > new Date();
  }

  return {
    async login({ usuario, password }, ctx = {}) {
      const empleado = await repo.findByUsuario(usuario);

      // Mensaje genérico para no revelar si el usuario existe.
      const credencialesInvalidas = () => ApiError.unauthorized('Usuario o contraseña incorrectos');

      if (!empleado || !empleado.activo) {
        await audit.log({ ip: ctx.ip, accion: `LOGIN_FALLIDO:${usuario}`, modulo: 'AUTH' });
        throw credencialesInvalidas();
      }

      if (estaBloqueado(empleado)) {
        throw ApiError.forbidden('Cuenta bloqueada temporalmente. Intente más tarde.');
      }

      const ok = await hasher.compare(password, empleado.password_hash);
      if (!ok) {
        await repo.registrarIntentoFallido(empleado, {
          maxAttempts: config.maxLoginAttempts,
          lockMinutes: config.lockMinutes,
        });
        await audit.log({
          idEmpleado: empleado.id_empleado,
          ip: ctx.ip,
          accion: 'LOGIN_FALLIDO',
          modulo: 'AUTH',
        });
        throw credencialesInvalidas();
      }

      await repo.resetIntentos(empleado);
      const token = await tokens.issue(empleado);
      await audit.log({
        idEmpleado: empleado.id_empleado,
        ip: ctx.ip,
        accion: 'LOGIN',
        modulo: 'AUTH',
      });

      return { token, empleado: empleado.toJSON() };
    },

    async logout(jti, ctx = {}) {
      await tokens.revoke(jti);
      await audit.log({ idEmpleado: ctx.idEmpleado, ip: ctx.ip, accion: 'LOGOUT', modulo: 'AUTH' });
    },

    async perfil(idEmpleado) {
      const empleado = await repo.findById(idEmpleado);
      if (!empleado) throw ApiError.notFound('Empleado no encontrado');
      return empleado.toJSON();
    },
  };
}

export const authService = createAuthService();
