import { describe, it, expect, jest } from '@jest/globals';
import { createReporteService } from '../src/services/reporte.service.js';

describe('ReporteService · Flujo de Caja', () => {
  it('calcula saldo inicial, entradas/salidas por origen y saldo final', async () => {
    const reporteRepo = {
      getSaldoCajaHasta: jest.fn().mockResolvedValue({ debe: 1000, haber: 400 }), // saldo inicial 600
      getMovimientosCajaPorOrigen: jest.fn().mockResolvedValue([
        { tipo_origen: 'VENTA', entradas: 500, salidas: 0 },
        { tipo_origen: 'PAGO', entradas: 0, salidas: 200 },
      ]),
    };
    const service = createReporteService({ reporteRepo, cuentaRepo: {} });

    const r = await service.generarFlujoCaja({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' });

    expect(r.saldo_inicial).toBe(600);
    expect(r.total_entradas).toBe(500);
    expect(r.total_salidas).toBe(200);
    expect(r.flujo_neto).toBe(300);
    expect(r.saldo_final).toBe(900);
    expect(r.movimientos).toHaveLength(2);
  });

  it('consulta el saldo de apertura al día anterior al inicio del período', async () => {
    const reporteRepo = {
      getSaldoCajaHasta: jest.fn().mockResolvedValue({ debe: 0, haber: 0 }),
      getMovimientosCajaPorOrigen: jest.fn().mockResolvedValue([]),
    };
    const service = createReporteService({ reporteRepo, cuentaRepo: {} });

    await service.generarFlujoCaja({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' });

    expect(reporteRepo.getSaldoCajaHasta).toHaveBeenCalledWith('2026-05-31');
  });
});
