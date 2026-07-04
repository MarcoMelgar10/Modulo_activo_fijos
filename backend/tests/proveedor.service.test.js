import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createProveedorService } from '../src/services/proveedor.service.js';

function buildRepo() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByNit: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(async (d) => ({ id_proveedor: 1, ...d })),
  };
}

describe('ProveedorService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = buildRepo();
    service = createProveedorService({ repo });
  });

  it('crea un proveedor cuando el NIT es único', async () => {
    const prov = await service.crear({ razon_social: 'ACME', nit: '123' });
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(prov.nit).toBe('123');
  });

  it('rechaza un NIT duplicado', async () => {
    repo.findByNit.mockResolvedValue({ id_proveedor: 9, nit: '123' });
    await expect(service.crear({ razon_social: 'ACME', nit: '123' })).rejects.toThrow(/NIT/);
  });

  it('la eliminación es baja lógica (activo = false)', async () => {
    const update = jest.fn();
    repo.findById.mockResolvedValue({ id_proveedor: 1, activo: true, update });
    await service.eliminar(1);
    expect(update).toHaveBeenCalledWith({ activo: false });
  });

  it('rechaza actualizar a un NIT que ya usa otro proveedor', async () => {
    repo.findById.mockResolvedValue({ id_proveedor: 1, nit: '111', update: jest.fn() });
    repo.findByNit.mockResolvedValue({ id_proveedor: 2, nit: '222' });
    await expect(service.actualizar(1, { nit: '222' })).rejects.toThrow(/NIT/);
  });

  it('lanza 404 si el proveedor no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.obtener(99)).rejects.toThrow(/no encontrado/);
  });
});
