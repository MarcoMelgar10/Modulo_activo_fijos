import { jest } from '@jest/globals';
import { createInventarioService } from '../src/services/inventario.service.js';

function mockRepo(overrides = {}) {
  return {
    findLotes: jest.fn().mockResolvedValue([
      { id_lote: 1, id_producto: 5, id_sucursal: 1, cantidad_actual: 10, activo: true },
      { id_lote: 2, id_producto: 5, id_sucursal: 2, cantidad_actual: 5, activo: true },
    ]),
    getStockAgregado: jest.fn().mockResolvedValue([
      { id_producto: 5, producto: 'Leche', id_sucursal: 1, sucursal: 'Casa Matriz', cantidad_total: 10, stock_minimo: 20, estado_stock: 'BAJO' },
      { id_producto: 5, producto: 'Leche', id_sucursal: 2, sucursal: 'SC Norte', cantidad_total: 5, stock_minimo: 20, estado_stock: 'BAJO' },
    ]),
    getStockProducto: jest.fn().mockResolvedValue([
      { id_lote: 1, numero_lote: 'L001', id_sucursal: 1, sucursal: 'Casa Matriz', cantidad_actual: 10, fecha_vencimiento: '2026-08-01' },
    ]),
    ...overrides,
  };
}

describe('InventarioService', () => {
  test('GERENTE ve lotes de todas las sucursales', async () => {
    const repo = mockRepo();
    const svc = createInventarioService({ repo });
    await svc.listarLotes({}, { rol: 'GERENTE', id_sucursal: 1 });
    expect(repo.findLotes).toHaveBeenCalledWith({});
  });

  test('BODEGUERO solo ve lotes de su sucursal', async () => {
    const repo = mockRepo();
    const svc = createInventarioService({ repo });
    await svc.listarLotes({}, { rol: 'BODEGUERO', id_sucursal: 1 });
    expect(repo.findLotes).toHaveBeenCalledWith({ id_sucursal: 1 });
  });

  test('calcula stock agregado por producto/sucursal', async () => {
    const repo = mockRepo();
    const svc = createInventarioService({ repo });
    const stock = await svc.getStockAgregado({}, { rol: 'GERENTE', id_sucursal: 1 });
    expect(stock).toHaveLength(2);
    expect(stock[0].estado_stock).toBe('BAJO');
  });

  test('excluye lotes inactivos con solo_disponible', async () => {
    const repo = mockRepo();
    const svc = createInventarioService({ repo });
    await svc.listarLotes({ solo_disponible: true }, { rol: 'GERENTE', id_sucursal: 1 });
    expect(repo.findLotes).toHaveBeenCalledWith({ solo_disponible: true });
  });

  test('getStockProducto devuelve lotes de un producto', async () => {
    const repo = mockRepo();
    const svc = createInventarioService({ repo });
    const lotes = await svc.getStockProducto(5);
    expect(lotes).toHaveLength(1);
    expect(repo.getStockProducto).toHaveBeenCalledWith(5);
  });
});
