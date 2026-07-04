import { jest } from '@jest/globals';
import { createTraspasoService } from '../src/services/traspaso.service.js';

const user = { id: 1, rol: 'GERENTE', id_sucursal: 1 };
const bodeguero = { id: 2, rol: 'BODEGUERO', id_sucursal: 1 };

function mockDeps(overrides = {}) {
  const traspasoDb = {
    id_traspaso: 1,
    id_sucursal_origen: 1,
    id_sucursal_destino: 2,
    estado: 'PENDIENTE',
    id_empleado: 1,
    detalles: [{ id_detalle: 1, id_lote: 10, cantidad: 5 }],
  };
  return {
    repo: {
      findAll: jest.fn().mockResolvedValue([traspasoDb]),
      findById: jest.fn().mockResolvedValue(traspasoDb),
      crear: jest.fn().mockResolvedValue({ id_traspaso: 1 }),
      actualizarEstado: jest.fn().mockResolvedValue([1]),
      actualizarDetalle: jest.fn().mockResolvedValue([1]),
      findDetallesByTraspaso: jest.fn().mockResolvedValue([{ id_detalle: 1, id_lote: 10, cantidad: 5 }]),
      transaction: jest.fn().mockImplementation(async (fn) => fn({})),
    },
    loteRepo: {
      findById: jest.fn().mockResolvedValue({ id_lote: 10, id_sucursal: 1, activo: true, cantidad_actual: 20 }),
      findByIdForUpdate: jest.fn().mockResolvedValue({ id_lote: 10, cantidad_actual: 20, update: jest.fn() }),
      findByIdWithProducto: jest.fn().mockResolvedValue({
        id_lote: 10, id_producto: 5, numero_lote: 'L001', fecha_vencimiento: '2026-08-01',
      }),
      actualizarCantidad: jest.fn().mockResolvedValue({}),
      crearDesdeTraspaso: jest.fn().mockResolvedValue({ id_lote: 99 }),
    },
    sucursalRepo: {
      findById: jest.fn().mockImplementation((id) =>
        Promise.resolve({ id_sucursal: id, estado: 'ACTIVA' }),
      ),
    },
    ...overrides,
  };
}

describe('TraspasoService', () => {
  test('crear traspaso PENDIENTE no descuenta stock', async () => {
    const deps = mockDeps();
    const svc = createTraspasoService(deps);
    await svc.crear({ id_sucursal_origen: 1, id_sucursal_destino: 2, detalles: [{ id_lote: 10, cantidad: 5 }] }, user);
    expect(deps.repo.crear).toHaveBeenCalled();
    expect(deps.loteRepo.actualizarCantidad).not.toHaveBeenCalled();
  });

  test('enviar descuenta lote origen', async () => {
    const deps = mockDeps();
    deps.repo.findById.mockResolvedValue({
      id_traspaso: 1, estado: 'PENDIENTE', id_sucursal_origen: 1, id_sucursal_destino: 2,
    });
    const svc = createTraspasoService(deps);
    await svc.enviar(1, user);
    expect(deps.loteRepo.actualizarCantidad).toHaveBeenCalled();
  });

  test('rechaza origen igual a destino', async () => {
    const deps = mockDeps();
    const svc = createTraspasoService(deps);
    await expect(
      svc.crear({ id_sucursal_origen: 1, id_sucursal_destino: 1, detalles: [{ id_lote: 10, cantidad: 5 }] }, user),
    ).rejects.toThrow(/diferentes/);
  });

  test('rechaza lote que no pertenece a origen', async () => {
    const deps = mockDeps();
    deps.loteRepo.findById.mockResolvedValue({ id_lote: 10, id_sucursal: 99, activo: true, cantidad_actual: 20 });
    const svc = createTraspasoService(deps);
    await expect(
      svc.crear({ id_sucursal_origen: 1, id_sucursal_destino: 2, detalles: [{ id_lote: 10, cantidad: 5 }] }, user),
    ).rejects.toThrow(/no pertenece/);
  });

  test('rechaza stock insuficiente', async () => {
    const deps = mockDeps();
    deps.loteRepo.findById.mockResolvedValue({ id_lote: 10, id_sucursal: 1, activo: true, cantidad_actual: 2 });
    const svc = createTraspasoService(deps);
    await expect(
      svc.crear({ id_sucursal_origen: 1, id_sucursal_destino: 2, detalles: [{ id_lote: 10, cantidad: 5 }] }, user),
    ).rejects.toThrow(/insuficiente/);
  });

  test('rechaza recibir traspaso no EN_TRANSITO', async () => {
    const deps = mockDeps();
    deps.repo.findById.mockResolvedValue({ id_traspaso: 1, estado: 'PENDIENTE' });
    const svc = createTraspasoService(deps);
    await expect(svc.recibir(1, null, user)).rejects.toThrow(/PENDIENTE/);
  });

  test('rechaza cancelar RECIBIDO', async () => {
    const deps = mockDeps();
    deps.repo.findById.mockResolvedValue({ id_traspaso: 1, estado: 'RECIBIDO' });
    const svc = createTraspasoService(deps);
    await expect(svc.cancelar(1, user)).rejects.toThrow(/recibido/);
  });

  test('BODEGUERO no puede crear desde otra sucursal', async () => {
    const deps = mockDeps();
    const svc = createTraspasoService(deps);
    await expect(
      svc.crear({ id_sucursal_origen: 99, id_sucursal_destino: 2, detalles: [{ id_lote: 10, cantidad: 5 }] }, bodeguero),
    ).rejects.toThrow(/otra sucursal/);
  });

  test('cancelar EN_TRANSITO repone stock origen', async () => {
    const deps = mockDeps();
    deps.repo.findById.mockResolvedValue({
      id_traspaso: 1, estado: 'EN_TRANSITO', id_sucursal_origen: 1, id_sucursal_destino: 2,
    });
    const svc = createTraspasoService(deps);
    await svc.cancelar(1, user);
    expect(deps.loteRepo.actualizarCantidad).toHaveBeenCalled();
  });
});
