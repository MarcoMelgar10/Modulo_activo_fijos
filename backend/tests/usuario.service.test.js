import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createUsuarioService } from '../src/services/usuario.service.js';

function buildDeps() {
  return {
    repo: {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findByUsuario: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (d) => ({ id_empleado: 5, ...d })),
      findRoles: jest.fn().mockResolvedValue([]),
      findRolById: jest.fn().mockResolvedValue({ id_rol: 4, nombre: 'CONTADOR' }),
      findSucursalById: jest.fn().mockResolvedValue({ id_sucursal: 1, estado: 'ACTIVA' }),
    },
    hasher: { hash: jest.fn().mockResolvedValue('HASH') },
  };
}

describe('UsuarioService', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = buildDeps();
    service = createUsuarioService(deps);
    deps.repo.findById.mockResolvedValue({ id_empleado: 5, usuario: 'nuevo', rol: { nombre: 'CONTADOR' } });
  });

  const base = { nombre: 'Ana', apellido: 'Pérez', usuario: 'anap', password: 'Secret123', id_rol: 4, id_sucursal: 1 };

  it('crea un usuario con la contraseña hasheada y rol asignado', async () => {
    await service.crear(base);
    expect(deps.hasher.hash).toHaveBeenCalledWith('Secret123', expect.any(Number));
    const data = deps.repo.create.mock.calls[0][0];
    expect(data.password_hash).toBe('HASH');
    expect(data.id_rol).toBe(4);
    expect(data.activo).toBe(true);
  });

  it('rechaza un nombre de usuario duplicado', async () => {
    deps.repo.findByUsuario.mockResolvedValue({ id_empleado: 1, usuario: 'anap' });
    await expect(service.crear(base)).rejects.toThrow(/ya existe/);
  });

  it('rechaza un rol inexistente', async () => {
    deps.repo.findRolById.mockResolvedValue(null);
    await expect(service.crear(base)).rejects.toThrow(/rol/);
  });

  it('no permite que el gerente se desactive a sí mismo', async () => {
    deps.repo.findById.mockResolvedValue({ id_empleado: 2, update: jest.fn() });
    await expect(service.cambiarEstado(2, false, 2)).rejects.toThrow(/propia cuenta/);
  });

  it('resetea intentos y bloqueo al cambiar la contraseña', async () => {
    const update = jest.fn();
    deps.repo.findById.mockResolvedValue({ id_empleado: 3, update });
    await service.actualizar(3, { password: 'NuevaClave1' }, 1);
    const updates = update.mock.calls[0][0];
    expect(updates.password_hash).toBe('HASH');
    expect(updates.intentos_fallidos).toBe(0);
    expect(updates.bloqueado_hasta).toBeNull();
  });
});
