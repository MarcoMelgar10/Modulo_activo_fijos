import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createProductoService } from '../src/services/producto.service.js';

function buildDeps() {
  const repo = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByCodigoBarras: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(async (d) => ({ id_producto: 1, ...d })),
  };
  const categoriaRepo = {
    findById: jest.fn().mockResolvedValue({ id_categoria: 1, nombre: 'Lácteos' }),
  };
  return { repo, categoriaRepo };
}

describe('ProductoService', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = buildDeps();
    service = createProductoService(deps);
  });

  const base = { id_categoria: 1, codigo_barras: '777', nombre: 'Leche', precio_compra: 6, precio_venta: 8 };

  it('crea un producto válido', async () => {
    const p = await service.crear(base);
    expect(deps.repo.create).toHaveBeenCalledTimes(1);
    expect(p.nombre).toBe('Leche');
  });

  it('rechaza código de barras duplicado', async () => {
    deps.repo.findByCodigoBarras.mockResolvedValue({ id_producto: 9, codigo_barras: '777' });
    await expect(service.crear(base)).rejects.toThrow(/código de barras/);
  });

  it('rechaza si la categoría no existe', async () => {
    deps.categoriaRepo.findById.mockResolvedValue(null);
    await expect(service.crear(base)).rejects.toThrow(/categoría/);
  });

  it('exige precio de venta mayor al de compra', async () => {
    await expect(service.crear({ ...base, precio_compra: 10, precio_venta: 8 })).rejects.toThrow(
      /precio de venta/,
    );
  });

  it('la eliminación es baja lógica (activo = false)', async () => {
    const update = jest.fn();
    deps.repo.findById.mockResolvedValue({ id_producto: 1, activo: true, precio_compra: 6, precio_venta: 8, update });
    await service.eliminar(1);
    expect(update).toHaveBeenCalledWith({ activo: false });
  });
});
