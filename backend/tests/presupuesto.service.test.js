import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createPresupuestoService } from '../src/services/presupuesto.service.js';

const cuentasDb = [
  { id_cuenta: 24, codigo: '4.1.1', nombre: 'Ventas', tipo: 'INGRESO', permite_movimiento: true },
  { id_cuenta: 30, codigo: '5.2.1', nombre: 'Gastos Adm', tipo: 'GASTO', permite_movimiento: true },
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', tipo: 'ACTIVO', permite_movimiento: true },
];

function buildDeps() {
  return {
    repo: {
      transaction: jest.fn().mockImplementation(async (fn) => fn({})),
      crearPresupuesto: jest.fn().mockImplementation(async (d) => ({ id_presupuesto: 1, ...d })),
      crearLineas: jest.fn().mockResolvedValue([]),
      borrarLineas: jest.fn().mockResolvedValue(0),
      findById: jest.fn().mockResolvedValue({ id_presupuesto: 1 }),
      findAll: jest.fn().mockResolvedValue([]),
      findAprobadoPorGestion: jest.fn().mockResolvedValue(null),
    },
    cuentaRepo: { findByIds: jest.fn().mockResolvedValue(cuentasDb) },
    reporteRepo: { getTotalesPorCuenta: jest.fn().mockResolvedValue([]) },
  };
}

describe('PresupuestoService', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = buildDeps();
    service = createPresupuestoService(deps);
  });

  describe('crear', () => {
    it('crea un presupuesto en BORRADOR con sus líneas', async () => {
      await service.crear(
        { nombre: 'Presupuesto 2026', gestion: 2026, lineas: [{ id_cuenta: 24, monto_planificado: 1000 }, { id_cuenta: 30, monto_planificado: 500 }] },
        1,
      );
      expect(deps.repo.crearPresupuesto.mock.calls[0][0].estado).toBe('BORRADOR');
      expect(deps.repo.crearLineas).toHaveBeenCalledTimes(1);
    });

    it('rechaza cuentas que no son de Ingreso o Gasto', async () => {
      await expect(
        service.crear({ nombre: 'x', gestion: 2026, lineas: [{ id_cuenta: 3, monto_planificado: 100 }] }, 1),
      ).rejects.toThrow(/Ingreso o Gasto/);
    });

    it('rechaza cuentas repetidas', async () => {
      await expect(
        service.crear({ nombre: 'x', gestion: 2026, lineas: [{ id_cuenta: 24, monto_planificado: 100 }, { id_cuenta: 24, monto_planificado: 50 }] }, 1),
      ).rejects.toThrow(/repetir/);
    });
  });

  describe('aprobar', () => {
    it('aprueba un presupuesto en BORRADOR', async () => {
      const p = { id_presupuesto: 1, gestion: 2026, estado: 'BORRADOR', update: jest.fn() };
      deps.repo.findById.mockResolvedValue(p);
      await service.aprobar(1, 2);
      expect(p.update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'APROBADO', id_empleado_aprobador: 2 }));
    });

    it('impide aprobar si ya hay uno aprobado para la gestión', async () => {
      deps.repo.findById.mockResolvedValue({ id_presupuesto: 1, gestion: 2026, estado: 'BORRADOR', update: jest.fn() });
      deps.repo.findAprobadoPorGestion.mockResolvedValue({ id_presupuesto: 9 });
      await expect(service.aprobar(1, 2)).rejects.toThrow(/ya existe un presupuesto aprobado/i);
    });
  });

  describe('ejecucion', () => {
    it('compara plan vs real y marca sobregiro / bajo meta', async () => {
      deps.repo.findById.mockResolvedValue({
        id_presupuesto: 1,
        nombre: 'P 2026',
        gestion: 2026,
        estado: 'APROBADO',
        lineas: [
          { id_cuenta: 24, monto_planificado: 1000, cuenta: { tipo: 'INGRESO', codigo: '4.1.1', nombre: 'Ventas' } },
          { id_cuenta: 30, monto_planificado: 500, cuenta: { tipo: 'GASTO', codigo: '5.2.1', nombre: 'Gastos Adm' } },
        ],
      });
      deps.reporteRepo.getTotalesPorCuenta.mockResolvedValue([
        { id_cuenta: 24, total_debe: 0, total_haber: 800 }, // ingreso real 800 (bajo meta)
        { id_cuenta: 30, total_debe: 600, total_haber: 0 }, // gasto real 600 (sobregiro)
      ]);

      const r = await service.ejecucion(1);

      const ing = r.lineas.find((l) => l.id_cuenta === 24);
      const gas = r.lineas.find((l) => l.id_cuenta === 30);
      expect(ing.real).toBe(800);
      expect(ing.alerta).toBe('BAJO_META');
      expect(gas.real).toBe(600);
      expect(gas.alerta).toBe('SOBREGIRO');

      expect(r.totales.plan_utilidad).toBe(500); // 1000 − 500
      expect(r.totales.real_utilidad).toBe(200); // 800 − 600
    });
  });
});
