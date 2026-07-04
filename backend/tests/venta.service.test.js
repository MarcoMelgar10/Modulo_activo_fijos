import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createVentaService } from '../src/services/venta.service.js';

const cuentasDb = [
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
  { id_cuenta: 4, codigo: '1.1.2', nombre: 'Bancos', permite_movimiento: true },
  { id_cuenta: 24, codigo: '4.1.1', nombre: 'Ventas', permite_movimiento: true },
  { id_cuenta: 14, codigo: '2.1.2', nombre: 'IVA Débito', permite_movimiento: true },
];

function buildDeps() {
  return {
    repo: {
      transaction: jest.fn().mockImplementation(async (fn) => fn({})),
      siguienteNumero: jest.fn().mockResolvedValue('VTA-2026-00001'),
      crearVenta: jest.fn().mockImplementation(async (d) => ({ id_venta: 100, ...d })),
      crearDetalles: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id_venta: 100, numero_venta: 'VTA-2026-00001', update: jest.fn() }),
    },
    productoRepo: {
      findByIds: jest.fn().mockResolvedValue([{ id_producto: 5, activo: true, nombre: 'Leche', precio_venta: 8 }]),
    },
    loteRepo: {
      findDisponiblesFEFO: jest.fn().mockResolvedValue([
        { id_lote: 1, cantidad_actual: 10, fecha_vencimiento: '2026-08-01' },
      ]),
      descontar: jest.fn().mockResolvedValue({}),
    },
    cuentaRepo: { findByCodigos: jest.fn().mockResolvedValue(cuentasDb) },
    asientoService: { crear: jest.fn().mockImplementation(async (d) => ({ id_asiento: 9, ...d })) },
  };
}

describe('VentaService', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = buildDeps();
    service = createVentaService(deps);
  });

  it('genera un asiento de venta con partida doble (Caja / Ventas + IVA por dentro)', async () => {
    await service.crear(
      { id_sucursal: 1, fecha: '2026-07-10', metodo_pago: 'EFECTIVO', lineas: [{ id_producto: 5, cantidad: 5 }] },
      2,
    );

    const data = deps.asientoService.crear.mock.calls[0][0];
    expect(data.tipo_origen).toBe('VENTA');
    expect(data.estado).toBe('CONFIRMADO');

    const caja = data.lineas.find((l) => l.id_cuenta === 3);
    const ventas = data.lineas.find((l) => l.id_cuenta === 24);
    const iva = data.lineas.find((l) => l.id_cuenta === 14);
    expect(caja.debe).toBe(40); // 5 × 8
    expect(ventas.haber).toBe(34.8);
    expect(iva.haber).toBe(5.2);

    const totalDebe = data.lineas.reduce((s, l) => s + l.debe, 0);
    const totalHaber = data.lineas.reduce((s, l) => s + l.haber, 0);
    expect(totalDebe).toBe(totalHaber);
  });

  it('descuenta el stock por FEFO tomando de varios lotes si hace falta', async () => {
    deps.loteRepo.findDisponiblesFEFO.mockResolvedValue([
      { id_lote: 1, cantidad_actual: 10, fecha_vencimiento: '2026-08-01' },
      { id_lote: 2, cantidad_actual: 10, fecha_vencimiento: '2026-09-01' },
    ]);

    await service.crear({ id_sucursal: 1, lineas: [{ id_producto: 5, cantidad: 15 }] }, 2);

    // Primero agota el lote que vence antes (id 1: 10 u), luego toma 5 del lote 2.
    expect(deps.loteRepo.descontar).toHaveBeenCalledWith(1, 10, expect.anything());
    expect(deps.loteRepo.descontar).toHaveBeenCalledWith(2, 5, expect.anything());
  });

  it('cobra a Bancos cuando el método de pago es tarjeta', async () => {
    await service.crear({ id_sucursal: 1, metodo_pago: 'TARJETA_DEBITO', lineas: [{ id_producto: 5, cantidad: 1 }] }, 2);
    const data = deps.asientoService.crear.mock.calls[0][0];
    const bancos = data.lineas.find((l) => l.id_cuenta === 4);
    expect(bancos.debe).toBe(8);
  });

  it('rechaza la venta si no hay stock suficiente', async () => {
    deps.loteRepo.findDisponiblesFEFO.mockResolvedValue([{ id_lote: 1, cantidad_actual: 3, fecha_vencimiento: '2026-08-01' }]);
    await expect(service.crear({ id_sucursal: 1, lineas: [{ id_producto: 5, cantidad: 10 }] }, 2)).rejects.toThrow(/insuficiente/);
    expect(deps.asientoService.crear).not.toHaveBeenCalled();
  });

  it('aplica el descuento sobre el total cobrado', async () => {
    await service.crear({ id_sucursal: 1, descuento: 4, lineas: [{ id_producto: 5, cantidad: 5 }] }, 2);
    const data = deps.asientoService.crear.mock.calls[0][0];
    const caja = data.lineas.find((l) => l.id_cuenta === 3);
    expect(caja.debe).toBe(36); // 40 − 4 de descuento
  });
});
