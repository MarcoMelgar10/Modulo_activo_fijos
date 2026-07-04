import { describe, it, expect, jest } from '@jest/globals';
import { createDashboardGerencialService } from '../src/services/dashboard-gerencial.service.js';

describe('DashboardGerencialService', () => {
  it('agrega ventas del día, órdenes pendientes, CxP, finanzas y stock', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const soonStr = soon.toISOString().slice(0, 10);

    const deps = {
      ventaRepo: {
        findAll: jest.fn().mockResolvedValue([
          { estado: 'COMPLETADA', monto_total: 100 },
          { estado: 'ANULADA', monto_total: 50 },
          { estado: 'COMPLETADA', monto_total: 200 },
        ]),
      },
      ordenRepo: {
        findAll: jest.fn().mockResolvedValue([
          { estado: 'BORRADOR', monto_total: 500 },
          { estado: 'RECIBIDA', monto_total: 1000 },
          { estado: 'ENVIADA', monto_total: 300 },
        ]),
      },
      cxpRepo: {
        findAll: jest.fn().mockResolvedValue([
          { estado: 'PENDIENTE', saldo_pendiente: 400 },
          { estado: 'PAGADA', saldo_pendiente: 0 },
          { estado: 'PARCIAL', saldo_pendiente: 100 },
        ]),
      },
      loteRepo: {
        findAll: jest.fn().mockResolvedValue([
          { id_lote: 1, id_producto: 5, cantidad_actual: 2, fecha_vencimiento: soonStr, numero_lote: 'L1', producto: { nombre: 'Leche' } },
        ]),
      },
      productoRepo: {
        findAll: jest.fn().mockResolvedValue([{ id_producto: 5, nombre: 'Leche', stock_minimo: 10 }]),
      },
      reporteRepo: { getIVAPorPeriodo: jest.fn().mockResolvedValue({ debito: 130, credito: 50 }) },
      reporteService: { generarEstadoResultados: jest.fn().mockResolvedValue({ resumen: { utilidad_neta: 1234 } }) },
    };

    const service = createDashboardGerencialService(deps);
    const r = await service.obtener();

    expect(r.ventas_hoy).toEqual({ cantidad: 2, total: 300 });
    expect(r.ordenes_pendientes).toEqual({ cantidad: 2, monto: 800 });
    expect(r.cuentas_por_pagar).toEqual({ cantidad: 2, saldo: 500 });
    expect(r.finanzas.utilidad_mes).toBe(1234);
    expect(r.finanzas.iva_neto).toBe(80);
    expect(r.stock.bajo).toHaveLength(1);
    expect(r.stock.bajo[0]).toMatchObject({ nombre: 'Leche', stock_actual: 2, stock_minimo: 10 });
    expect(r.stock.por_vencer).toHaveLength(1);
  });
});
