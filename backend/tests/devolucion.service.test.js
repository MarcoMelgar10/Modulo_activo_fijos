import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createDevolucionService } from '../src/services/devolucion.service.js';

const cuentasDb = [
  { id_cuenta: 25, codigo: '4.1.2', nombre: 'Devoluciones sobre Ventas', permite_movimiento: true },
  { id_cuenta: 14, codigo: '2.1.2', nombre: 'IVA Débito', permite_movimiento: true },
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
  { id_cuenta: 4, codigo: '1.1.2', nombre: 'Bancos', permite_movimiento: true },
];

function nuevaVenta(overrides = {}) {
  return {
    id_venta: 100,
    estado: 'COMPLETADA',
    metodo_pago: 'EFECTIVO',
    id_sucursal: 1,
    numero_venta: 'VTA-2026-00001',
    detalles: [{ id_detalle: 1, id_lote: 1, id_producto: 5, cantidad: 5, precio_unitario: 8 }],
    update: jest.fn(),
    ...overrides,
  };
}

function buildDeps(venta) {
  return {
    repo: {
      crearDevolucion: jest.fn().mockImplementation(async (d) => ({ id_devolucion: 1, ...d })),
      crearDetalles: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id_devolucion: 1, update: jest.fn() }),
    },
    ventaRepo: {
      findById: jest.fn().mockResolvedValue(venta),
      transaction: jest.fn().mockImplementation(async (fn) => fn({})),
    },
    loteRepo: { reponer: jest.fn().mockResolvedValue({}) },
    cuentaRepo: { findByCodigos: jest.fn().mockResolvedValue(cuentasDb) },
    asientoService: { crear: jest.fn().mockImplementation(async (d) => ({ id_asiento: 55, ...d })) },
  };
}

describe('DevolucionService', () => {
  it('repone stock y genera el asiento de reversa balanceado', async () => {
    const venta = nuevaVenta();
    const deps = buildDeps(venta);
    const service = createDevolucionService(deps);

    await service.crear(
      { id_venta: 100, motivo: 'Producto dañado', lineas: [{ id_detalle_venta: 1, cantidad_dev: 2 }] },
      2,
    );

    expect(deps.loteRepo.reponer).toHaveBeenCalledWith(1, 2, expect.anything());
    expect(venta.update).toHaveBeenCalledWith({ estado: 'DEVOLUCION_PARCIAL' }, expect.anything());

    const data = deps.asientoService.crear.mock.calls[0][0];
    expect(data.tipo_origen).toBe('DEVOLUCION');
    const devol = data.lineas.find((l) => l.id_cuenta === 25);
    const iva = data.lineas.find((l) => l.id_cuenta === 14);
    const caja = data.lineas.find((l) => l.id_cuenta === 3);
    expect(devol.debe).toBe(13.92); // neto de 16
    expect(iva.debe).toBe(2.08);
    expect(caja.haber).toBe(16);

    const totalDebe = data.lineas.reduce((s, l) => s + l.debe, 0);
    const totalHaber = data.lineas.reduce((s, l) => s + l.haber, 0);
    expect(totalDebe).toBe(totalHaber);
  });

  it('rechaza devolver más unidades de las vendidas', async () => {
    const deps = buildDeps(nuevaVenta());
    const service = createDevolucionService(deps);
    await expect(
      service.crear({ id_venta: 100, motivo: 'x', lineas: [{ id_detalle_venta: 1, cantidad_dev: 99 }] }, 2),
    ).rejects.toThrow(/más unidades/);
  });

  it('rechaza devoluciones sobre una venta anulada', async () => {
    const deps = buildDeps(nuevaVenta({ estado: 'ANULADA' }));
    const service = createDevolucionService(deps);
    await expect(
      service.crear({ id_venta: 100, motivo: 'x', lineas: [{ id_detalle_venta: 1, cantidad_dev: 1 }] }, 2),
    ).rejects.toThrow(/anulada/);
  });
});
