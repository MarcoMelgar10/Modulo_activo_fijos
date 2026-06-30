import { describe, it, expect, jest } from '@jest/globals';
import { createCierreService } from '../src/services/cierre.service.js';

const cuentas = [
  { id_cuenta: 24, codigo: '4.1.1', nombre: 'Ventas', tipo: 'INGRESO' },
  { id_cuenta: 30, codigo: '5.2.1', nombre: 'Gastos de Administración', tipo: 'GASTO' },
  { id_cuenta: 21, codigo: '3.2.1', nombre: 'Resultado del Ejercicio', tipo: 'PATRIMONIO' },
];

function buildDeps({ totales = [], periodoCerrado = null } = {}) {
  const crearAsiento = jest.fn(async (payload) => ({
    id_asiento: 99,
    numero_asiento: 'AST-2026-00010',
    ...payload,
  }));
  return {
    repo: {
      findByPeriodo: jest.fn().mockResolvedValue(periodoCerrado),
      crear: jest.fn(async (d) => ({ id_cierre: 1, ...d })),
    },
    reporteRepo: { getTotalesPorCuenta: jest.fn().mockResolvedValue(totales) },
    cuentaRepo: {
      findAll: jest.fn().mockResolvedValue(cuentas),
      findByCodigo: jest.fn(async (c) => cuentas.find((x) => x.codigo === c) ?? null),
    },
    asientoService: { crear: crearAsiento },
    _crearAsiento: crearAsiento,
  };
}

describe('CierreService.cerrarPeriodo (anual)', () => {
  it('genera un asiento de cierre balanceado y registra la utilidad en patrimonio', async () => {
    const deps = buildDeps({
      totales: [
        { id_cuenta: 24, total_debe: 0, total_haber: 1000 },
        { id_cuenta: 30, total_debe: 600, total_haber: 0 },
      ],
    });
    const service = createCierreService(deps);

    const { cierre } = await service.cerrarPeriodo({ anio: 2026, idEmpleado: 1, idSucursal: 1 });

    expect(cierre.total_ingresos).toBe(1000);
    expect(cierre.total_gastos).toBe(600);
    expect(cierre.resultado).toBe(400);

    const payload = deps._crearAsiento.mock.calls[0][0];
    expect(payload.tipo_origen).toBe('CIERRE');
    expect(payload.estado).toBe('CONFIRMADO');

    const totalDebe = payload.lineas.reduce((a, l) => a + l.debe, 0);
    const totalHaber = payload.lineas.reduce((a, l) => a + l.haber, 0);
    expect(totalDebe).toBeCloseTo(totalHaber, 2);

    const lineaResultado = payload.lineas.find((l) => l.id_cuenta === 21);
    expect(lineaResultado.haber).toBe(400);
  });

  it('registra una pérdida al Debe de la cuenta de resultado', async () => {
    const deps = buildDeps({
      totales: [
        { id_cuenta: 24, total_debe: 0, total_haber: 500 },
        { id_cuenta: 30, total_debe: 800, total_haber: 0 },
      ],
    });
    const service = createCierreService(deps);

    const { cierre } = await service.cerrarPeriodo({ anio: 2026 });

    expect(cierre.resultado).toBe(-300);
    const payload = deps._crearAsiento.mock.calls[0][0];
    const lineaResultado = payload.lineas.find((l) => l.id_cuenta === 21);
    expect(lineaResultado.debe).toBe(300);
  });

  it('rechaza cerrar una gestión ya cerrada (409)', async () => {
    const deps = buildDeps({ periodoCerrado: { id_cierre: 1 } });
    const service = createCierreService(deps);
    await expect(service.cerrarPeriodo({ anio: 2026 })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rechaza cerrar si no hay ingresos ni gastos (400)', async () => {
    const deps = buildDeps({ totales: [] });
    const service = createCierreService(deps);
    await expect(service.cerrarPeriodo({ anio: 2026 })).rejects.toMatchObject({ statusCode: 400 });
  });
});
