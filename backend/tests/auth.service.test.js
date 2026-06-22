import { describe, it, expect, jest } from '@jest/globals';
import { createAuthService } from '../src/services/auth.service.js';

function buildEmpleado(overrides = {}) {
  return {
    id_empleado: 1,
    id_sucursal: 1,
    usuario: 'contador',
    password_hash: 'hash',
    activo: true,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    rol: { nombre: 'CONTADOR' },
    toJSON() {
      const { password_hash: _omit, ...rest } = this;
      return rest;
    },
    ...overrides,
  };
}

function buildDeps(empleado, { compareResult = true } = {}) {
  return {
    repo: {
      findByUsuario: jest.fn().mockResolvedValue(empleado),
      findById: jest.fn().mockResolvedValue(empleado),
      registrarIntentoFallido: jest.fn().mockResolvedValue(empleado),
      resetIntentos: jest.fn().mockResolvedValue(undefined),
    },
    hasher: { compare: jest.fn().mockResolvedValue(compareResult) },
    tokens: { issue: jest.fn().mockResolvedValue('jwt-token'), revoke: jest.fn() },
    audit: { log: jest.fn().mockResolvedValue(undefined) },
    config: { maxLoginAttempts: 5, lockMinutes: 15 },
  };
}

describe('AuthService.login', () => {
  it('autentica credenciales válidas y devuelve token sin exponer el hash', async () => {
    const deps = buildDeps(buildEmpleado());
    const service = createAuthService(deps);

    const result = await service.login({ usuario: 'contador', password: 'Contador123' });

    expect(result.token).toBe('jwt-token');
    expect(result.empleado).not.toHaveProperty('password_hash');
    expect(deps.repo.resetIntentos).toHaveBeenCalled();
    expect(deps.audit.log).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN' }));
  });

  it('rechaza contraseña incorrecta y registra intento fallido', async () => {
    const deps = buildDeps(buildEmpleado(), { compareResult: false });
    const service = createAuthService(deps);

    await expect(service.login({ usuario: 'contador', password: 'mala' })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(deps.repo.registrarIntentoFallido).toHaveBeenCalled();
  });

  it('rechaza usuario inexistente con 401 genérico', async () => {
    const deps = buildDeps(null);
    const service = createAuthService(deps);

    await expect(service.login({ usuario: 'nadie', password: 'x' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('bloquea el acceso si la cuenta está bloqueada temporalmente', async () => {
    const future = new Date(Date.now() + 10 * 60_000);
    const deps = buildDeps(buildEmpleado({ bloqueado_hasta: future }));
    const service = createAuthService(deps);

    await expect(service.login({ usuario: 'contador', password: 'x' })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(deps.hasher.compare).not.toHaveBeenCalled();
  });
});
