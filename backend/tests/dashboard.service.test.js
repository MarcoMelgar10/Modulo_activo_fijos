import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createDashboardService } from '../src/services/dashboard.service.js';

function buildDeps() {
  const reporteRepo = {
    getIVAPorPeriodo: jest.fn().mockResolvedValue({ debito: 130, credito: 650 }),
  };
  const cierreRepo = {
    findByPeriodo: jest.fn().mockResolvedValue(null),
  };
  const reporteService = {
    generarEstadoResultados: jest.fn().mockResolvedValue({
      resumen: { total_ingresos: 1000, total_gastos: 304, utilidad_neta: 696 },
    }),
  };
  return { reporteRepo, cierreRepo, reporteService };
}

describe('DashboardService', () => {
  let service;
  let deps;

  beforeEach(() => {
    deps = buildDeps();
    service = createDashboardService(deps);
  });

  it('retorna KPIs con utilidad, IVA y estado de cierre', async () => {
    const result = await service.obtenerKPIs({ gestion: 2026, mes: 6 });

    expect(result.gestion).toBe(2026);
    expect(result.mes).toBe(6);
    expect(result.utilidad_ejercicio).toBe(696);
    expect(result.iva_debito).toBe(130);
    expect(result.iva_credito).toBe(650);
    expect(result.iva_neto).toBe(-520);
    expect(result.cierre_estado).toBe('ABIERTO');
  });

  it('marca cierre_estado como CERRADO si existe cierre', async () => {
    deps.cierreRepo.findByPeriodo.mockResolvedValue({ id: 1, estado: 'CERRADO' });

    const result = await service.obtenerKPIs({ gestion: 2026, mes: 6 });
    expect(result.cierre_estado).toBe('CERRADO');
  });

  it('calcula IVA neto positivo (a favor del fisco)', async () => {
    deps.reporteRepo.getIVAPorPeriodo.mockResolvedValue({ debito: 500, credito: 200 });

    const result = await service.obtenerKPIs({ gestion: 2026, mes: 6 });
    expect(result.iva_neto).toBe(300);
  });

  it('pasa las fechas correctas al reporteService', async () => {
    await service.obtenerKPIs({ gestion: 2026, mes: 6 });

    expect(deps.reporteService.generarEstadoResultados).toHaveBeenCalledWith({
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-12-31',
    });
  });

  it('pasa las fechas del mes al reporteRepo para IVA', async () => {
    await service.obtenerKPIs({ gestion: 2026, mes: 6 });

    expect(deps.reporteRepo.getIVAPorPeriodo).toHaveBeenCalledWith({
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-06-30',
    });
  });

  it('calcula correctamente el último día de febrero', async () => {
    await service.obtenerKPIs({ gestion: 2026, mes: 2 });

    expect(deps.reporteRepo.getIVAPorPeriodo).toHaveBeenCalledWith({
      fecha_inicio: '2026-02-01',
      fecha_fin: '2026-02-28',
    });
  });
});
