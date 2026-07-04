import { jest } from '@jest/globals';
import { createSucursalService } from '../src/services/sucursal.service.js';

function mockRepo(overrides = {}) {
  return {
    findAll: jest.fn().mockResolvedValue([
      { id_sucursal: 1, nombre: 'Casa Matriz', ciudad: 'SC', direccion: 'Dir', estado: 'ACTIVA' },
      { id_sucursal: 2, nombre: 'Sucursal 2', ciudad: 'LP', direccion: 'Dir2', estado: 'ACTIVA' },
    ]),
    findById: jest.fn().mockImplementation((id) => {
      if (id === 1) return Promise.resolve({ id_sucursal: 1, nombre: 'Casa Matriz', estado: 'ACTIVA', update: jest.fn() });
      if (id === 2) return Promise.resolve({ id_sucursal: 2, nombre: 'Sucursal 2', estado: 'ACTIVA', update: jest.fn() });
      return Promise.resolve(null);
    }),
    findByNombre: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => Promise.resolve({ id_sucursal: 99, ...data })),
    tieneOperacionesPendientes: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('SucursalService', () => {
  test('lista todas las sucursales para GERENTE', async () => {
    const repo = mockRepo();
    const svc = createSucursalService({ repo });
    const result = await svc.listar({ rol: 'GERENTE', id_sucursal: 1 });
    expect(result).toHaveLength(2);
    expect(repo.findAll).toHaveBeenCalled();
  });

  test('crea sucursal válida', async () => {
    const repo = mockRepo();
    const svc = createSucursalService({ repo });
    const result = await svc.crear({ nombre: 'Nueva', ciudad: 'CBBA', direccion: 'Dir' });
    expect(result.nombre).toBe('Nueva');
    expect(repo.create).toHaveBeenCalled();
  });

  test('rechaza nombre duplicado', async () => {
    const repo = mockRepo({ findByNombre: jest.fn().mockResolvedValue({ id_sucursal: 1, nombre: 'Casa Matriz' }) });
    const svc = createSucursalService({ repo });
    await expect(svc.crear({ nombre: 'Casa Matriz', ciudad: 'X', direccion: 'Y' }))
      .rejects.toThrow('ya existe');
  });

  test('rechaza inactivar sucursal con operaciones activas', async () => {
    const repo = mockRepo({ tieneOperacionesPendientes: jest.fn().mockResolvedValue(true) });
    const svc = createSucursalService({ repo });
    await expect(svc.cambiarEstado(1, 'INACTIVA'))
      .rejects.toThrow('operaciones activas');
  });

  test('BODEGUERO solo ve su sucursal', async () => {
    const repo = mockRepo();
    const svc = createSucursalService({ repo });
    const result = await svc.listar({ rol: 'BODEGUERO', id_sucursal: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].id_sucursal).toBe(1);
  });

  test('obtener sucursal inexistente lanza 404', async () => {
    const repo = mockRepo();
    const svc = createSucursalService({ repo });
    await expect(svc.obtener(999, { rol: 'GERENTE' })).rejects.toThrow('no encontrada');
  });
});
