import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createLibroFiscalService } from '../src/services/libro-fiscal.service.js';

const registrosCompra = [
  { fecha: '2026-06-15', numero_asiento: 'AST-2026-00002', concepto: 'Compra — OC #501', monto_neto: 4350, iva: 650, monto_total: 5000 },
];

const registrosVenta = [
  { fecha: '2026-06-15', numero_asiento: 'AST-2026-00001', concepto: 'Venta — POS #1001', monto_neto: 870, iva: 130, monto_total: 1000 },
];

function buildDeps() {
  const repo = {
    getRegistros: jest.fn().mockResolvedValue([]),
  };
  return { repo };
}

describe('LibroFiscalService', () => {
  let service;
  let deps;

  beforeEach(() => {
    deps = buildDeps();
    service = createLibroFiscalService(deps);
  });

  describe('obtenerLibroCompras', () => {
    it('retorna estructura con periodo, registros y totales', async () => {
      deps.repo.getRegistros.mockResolvedValue(registrosCompra);

      const result = await service.obtenerLibroCompras({ mes: 6, gestion: 2026 });

      expect(result.periodo).toEqual({ mes: 6, gestion: 2026 });
      expect(result.registros).toHaveLength(1);
      expect(result.totales.total_neto).toBe(4350);
      expect(result.totales.total_iva).toBe(650);
      expect(result.totales.total_general).toBe(5000);
    });

    it('pasa tipo_origen COMPRA al repositorio', async () => {
      await service.obtenerLibroCompras({ mes: 6, gestion: 2026 });

      expect(deps.repo.getRegistros).toHaveBeenCalledWith({
        tipo_origen: 'COMPRA',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
      });
    });

    it('retorna totales en 0 cuando no hay registros', async () => {
      deps.repo.getRegistros.mockResolvedValue([]);

      const result = await service.obtenerLibroCompras({ mes: 6, gestion: 2026 });

      expect(result.registros).toHaveLength(0);
      expect(result.totales.total_neto).toBe(0);
      expect(result.totales.total_iva).toBe(0);
      expect(result.totales.total_general).toBe(0);
    });

    it('suma correctamente múltiples registros', async () => {
      deps.repo.getRegistros.mockResolvedValue([
        { fecha: '2026-06-10', numero_asiento: 'AST-2026-00001', concepto: 'A', monto_neto: 1000, iva: 130, monto_total: 1130 },
        { fecha: '2026-06-20', numero_asiento: 'AST-2026-00002', concepto: 'B', monto_neto: 2000, iva: 260, monto_total: 2260 },
      ]);

      const result = await service.obtenerLibroCompras({ mes: 6, gestion: 2026 });

      expect(result.totales.total_neto).toBe(3000);
      expect(result.totales.total_iva).toBe(390);
      expect(result.totales.total_general).toBe(3390);
    });
  });

  describe('obtenerLibroVentas', () => {
    it('pasa tipo_origen VENTA al repositorio', async () => {
      await service.obtenerLibroVentas({ mes: 6, gestion: 2026 });

      expect(deps.repo.getRegistros).toHaveBeenCalledWith({
        tipo_origen: 'VENTA',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
      });
    });

    it('retorna registros de ventas con IVA débito', async () => {
      deps.repo.getRegistros.mockResolvedValue(registrosVenta);

      const result = await service.obtenerLibroVentas({ mes: 6, gestion: 2026 });

      expect(result.registros[0].iva).toBe(130);
      expect(result.totales.total_iva).toBe(130);
    });
  });
});
