import { jest } from '@jest/globals';
import { createAccesoBiometricoService } from '../src/services/acceso-biometrico.service.js';

function mockDeps(overrides = {}) {
  return {
    repo: {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => Promise.resolve({ id_acceso: 1, ...d })),
    },
    dispositivoRepo: {
      findById: jest.fn().mockImplementation((id) => {
        if (id === 'BIO-SC-001') return Promise.resolve({
          dispositivo_id: 'BIO-SC-001', id_sucursal: 1, activo: true,
          secret_hash: '$2b$10$hash', sucursal: { estado: 'ACTIVA' },
        });
        return Promise.resolve(null);
      }),
    },
    hasher: {
      compare: jest.fn().mockResolvedValue(true),
    },
    ...overrides,
  };
}

const bodeguero = { id: 2, rol: { nombre: 'BODEGUERO' }, id_sucursal: 1, activo: true };
const gerente = { id: 1, rol: { nombre: 'GERENTE' }, id_sucursal: 1, activo: true };
const cajero = { id: 3, rol: { nombre: 'CAJERO' }, id_sucursal: 1, activo: true };
const bodegueroOtraSucursal = { id: 4, rol: { nombre: 'BODEGUERO' }, id_sucursal: 99, activo: true };
const empleadoInactivo = { id: 5, rol: { nombre: 'BODEGUERO' }, id_sucursal: 1, activo: false };

const mockEmpleadoRepo = {
  findById: jest.fn().mockImplementation((id) => {
    const map = { 1: gerente, 2: bodeguero, 3: cajero, 4: bodegueroOtraSucursal, 5: empleadoInactivo };
    return Promise.resolve(map[id] || null);
  }),
};

describe('AccesoBiometricoService', () => {
  test('autoriza BODEGUERO activo en misma sucursal', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 2, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(true);
    expect(result.mensaje).toBe('ACCESO_AUTORIZADO');
  });

  test('autoriza GERENTE aunque su sucursal difiera', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 1, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(true);
  });

  test('deniega CAJERO', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 3, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.mensaje).toBe('ROL_NO_AUTORIZADO');
  });

  test('deniega empleado inactivo', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 5, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.mensaje).toBe('EMPLEADO_INACTIVO');
  });

  test('deniega empleado de otra sucursal', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 4, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.mensaje).toBe('SUCURSAL_DIFERENTE');
  });

  test('deniega dispositivo inexistente', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-NO-EXISTE', 2, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.mensaje).toBe('DISPOSITIVO_NO_ENCONTRADO');
  });

  test('deniega dispositivo inactivo', async () => {
    const deps = mockDeps();
    deps.dispositivoRepo.findById.mockResolvedValue({
      dispositivo_id: 'BIO-SC-001', id_sucursal: 1, activo: false,
    });
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.autorizar('BIO-SC-001', 2, 'ENTRADA', mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.mensaje).toBe('DISPOSITIVO_INACTIVO');
  });

  test('registra evento denegado cuando empleado no cumple reglas', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    const result = await svc.simular('BIO-SC-001', 3, 'ENTRADA', null, mockEmpleadoRepo);
    expect(result.autorizado).toBe(false);
    expect(result.acceso.resultado).toBe(false);
    expect(deps.repo.create).toHaveBeenCalled();
  });

  test('BODEGUERO solo lista eventos de su sucursal', async () => {
    const deps = mockDeps();
    const svc = createAccesoBiometricoService(deps);
    await svc.listar({}, { rol: 'BODEGUERO', id_sucursal: 1 });
    expect(deps.repo.findAll).toHaveBeenCalledWith({ id_sucursal: 1 });
  });
});
