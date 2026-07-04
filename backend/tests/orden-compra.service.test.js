import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createOrdenCompraService } from '../src/services/orden-compra.service.js';

const cuentasDb = [
  { id_cuenta: 6, codigo: '1.1.4', nombre: 'Inventario', permite_movimiento: true },
  { id_cuenta: 7, codigo: '1.1.5', nombre: 'IVA Crédito', permite_movimiento: true },
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
  { id_cuenta: 13, codigo: '2.1.1', nombre: 'Cuentas por Pagar', permite_movimiento: true },
];

function buildDeps() {
  return {
    repo: {
      transaction: jest.fn().mockImplementation(async (fn) => fn({})),
      siguienteNumero: jest.fn().mockResolvedValue('OC-2026-00001'),
      crearOrden: jest.fn().mockImplementation(async (d) => ({ id_orden: 1, ...d })),
      crearDetalles: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
    },
    proveedorRepo: { findById: jest.fn().mockResolvedValue({ id_proveedor: 2, activo: true }) },
    productoRepo: {
      findByIds: jest.fn().mockResolvedValue([{ id_producto: 5, activo: true, nombre: 'Leche' }]),
    },
    loteRepo: { bulkCreate: jest.fn().mockResolvedValue([]) },
    cxpRepo: { create: jest.fn().mockResolvedValue({}) },
    cuentaRepo: { findByCodigos: jest.fn().mockResolvedValue(cuentasDb) },
    asientoService: {
      crear: jest.fn().mockImplementation(async (d) => ({ id_asiento: 77, ...d })),
    },
  };
}

describe('OrdenCompraService', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = buildDeps();
    service = createOrdenCompraService(deps);
  });

  describe('crear', () => {
    it('calcula el monto total a partir de las líneas', async () => {
      deps.repo.findById.mockResolvedValue({ id_orden: 1 });
      await service.crear({
        id_proveedor: 2,
        id_sucursal: 1,
        fecha_emision: '2026-07-02',
        condicion_pago: 'CREDITO',
        lineas: [{ id_producto: 5, cantidad: 10, precio_unitario: 100 }],
      });
      const data = deps.repo.crearOrden.mock.calls[0][0];
      expect(data.monto_total).toBe(1000);
      expect(data.estado).toBe('BORRADOR');
    });

    it('rechaza un producto inexistente', async () => {
      deps.productoRepo.findByIds.mockResolvedValue([]);
      await expect(
        service.crear({
          id_proveedor: 2,
          id_sucursal: 1,
          fecha_emision: '2026-07-02',
          lineas: [{ id_producto: 999, cantidad: 1, precio_unitario: 10 }],
        }),
      ).rejects.toThrow(/no existe/);
    });
  });

  describe('recibir (a crédito)', () => {
    const orden = {
      id_orden: 1,
      numero_orden: 'OC-2026-00001',
      estado: 'ENVIADA',
      condicion_pago: 'CREDITO',
      id_sucursal: 1,
      id_proveedor: 2,
      monto_total: 1000,
      proveedor: { razon_social: 'ACME' },
      detalles: [{ id_producto: 5, cantidad: 10 }],
      update: jest.fn(),
    };

    beforeEach(() => {
      orden.update.mockClear();
      deps.repo.findById.mockResolvedValue(orden);
    });

    it('genera un asiento CONFIRMADO de tipo COMPRA con partida doble (IVA por dentro)', async () => {
      await service.recibir(1, { fecha_recepcion: '2026-07-03' });

      const data = deps.asientoService.crear.mock.calls[0][0];
      expect(data.estado).toBe('CONFIRMADO');
      expect(data.tipo_origen).toBe('COMPRA');

      const inv = data.lineas.find((l) => l.id_cuenta === 6);
      const iva = data.lineas.find((l) => l.id_cuenta === 7);
      const cxp = data.lineas.find((l) => l.id_cuenta === 13);
      expect(inv.debe).toBe(870);
      expect(iva.debe).toBe(130);
      expect(cxp.haber).toBe(1000);

      const totalDebe = data.lineas.reduce((s, l) => s + l.debe, 0);
      const totalHaber = data.lineas.reduce((s, l) => s + l.haber, 0);
      expect(totalDebe).toBe(totalHaber);
    });

    it('crea un lote por cada línea recibida (RF-COM-03)', async () => {
      await service.recibir(1, { fecha_recepcion: '2026-07-03' });
      const [rows] = deps.loteRepo.bulkCreate.mock.calls[0];
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id_producto: 5, cantidad_inicial: 10, cantidad_actual: 10 });
    });

    it('registra la cuenta por pagar por el total (RF-COM-04)', async () => {
      await service.recibir(1, { fecha_recepcion: '2026-07-03' });
      const cxpData = deps.cxpRepo.create.mock.calls[0][0];
      expect(cxpData).toMatchObject({ monto_total: 1000, saldo_pendiente: 1000, estado: 'PENDIENTE' });
    });

    it('marca la orden como RECIBIDA', async () => {
      await service.recibir(1, { fecha_recepcion: '2026-07-03' });
      expect(orden.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'RECIBIDA' }));
    });
  });

  it('al contado acredita Caja en lugar de Cuentas por Pagar y no crea CxP', async () => {
    const orden = {
      id_orden: 2,
      numero_orden: 'OC-2026-00002',
      estado: 'ENVIADA',
      condicion_pago: 'CONTADO',
      id_sucursal: 1,
      id_proveedor: 2,
      monto_total: 1000,
      proveedor: { razon_social: 'ACME' },
      detalles: [{ id_producto: 5, cantidad: 10 }],
      update: jest.fn(),
    };
    deps.repo.findById.mockResolvedValue(orden);

    await service.recibir(2, { fecha_recepcion: '2026-07-03' });

    const data = deps.asientoService.crear.mock.calls[0][0];
    const caja = data.lineas.find((l) => l.id_cuenta === 3);
    expect(caja.haber).toBe(1000);
    expect(deps.cxpRepo.create).not.toHaveBeenCalled();
  });

  it('solo recibe órdenes en estado ENVIADA', async () => {
    deps.repo.findById.mockResolvedValue({ id_orden: 3, estado: 'BORRADOR' });
    await expect(service.recibir(3, {})).rejects.toThrow(/ENVIADAS/);
  });
});
