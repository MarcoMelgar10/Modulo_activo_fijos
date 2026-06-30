import { describe, it, expect, jest } from '@jest/globals';
import { createReporteService } from '../src/services/reporte.service.js';

/**
 * Tests unitarios para el servicio de Reportes Financieros (Etapa 6).
 * Verifican la propagación jerárquica y la ecuación contable con mocks.
 */

// ── Plan de cuentas de prueba (árbol mínimo) ────────────────────────
//
//  1. ACTIVO (raíz)
//    1.1 Activo Corriente (grupo)
//      1.1.1 Caja (hoja)
//      1.1.3 Cuentas por Cobrar (hoja)
//  2. PASIVO (raíz)
//    2.1 Pasivo Corriente (grupo)
//      2.1.1 Cuentas por Pagar (hoja)
//  3. PATRIMONIO (raíz)
//    3.1 Capital (grupo)
//      3.1.1 Capital Social (hoja)
//  4. INGRESO (raíz)
//    4.1 Ingresos Operativos (grupo)
//      4.1.1 Ventas (hoja)
//  5. GASTO (raíz)
//    5.1 Gastos Operativos (grupo)
//      5.1.1 Sueldos (hoja)
//      5.1.2 Alquileres (hoja)

function planDeCuentas() {
  return [
    { id_cuenta: 1, codigo: '1', nombre: 'ACTIVO', tipo: 'ACTIVO', nivel: 1, id_cuenta_padre: null, permite_movimiento: false },
    { id_cuenta: 2, codigo: '1.1', nombre: 'Activo Corriente', tipo: 'ACTIVO', nivel: 2, id_cuenta_padre: 1, permite_movimiento: false },
    { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', tipo: 'ACTIVO', nivel: 3, id_cuenta_padre: 2, permite_movimiento: true },
    { id_cuenta: 4, codigo: '1.1.3', nombre: 'Cuentas por Cobrar', tipo: 'ACTIVO', nivel: 3, id_cuenta_padre: 2, permite_movimiento: true },
    { id_cuenta: 10, codigo: '2', nombre: 'PASIVO', tipo: 'PASIVO', nivel: 1, id_cuenta_padre: null, permite_movimiento: false },
    { id_cuenta: 11, codigo: '2.1', nombre: 'Pasivo Corriente', tipo: 'PASIVO', nivel: 2, id_cuenta_padre: 10, permite_movimiento: false },
    { id_cuenta: 12, codigo: '2.1.1', nombre: 'Cuentas por Pagar', tipo: 'PASIVO', nivel: 3, id_cuenta_padre: 11, permite_movimiento: true },
    { id_cuenta: 20, codigo: '3', nombre: 'PATRIMONIO', tipo: 'PATRIMONIO', nivel: 1, id_cuenta_padre: null, permite_movimiento: false },
    { id_cuenta: 21, codigo: '3.1', nombre: 'Capital', tipo: 'PATRIMONIO', nivel: 2, id_cuenta_padre: 20, permite_movimiento: false },
    { id_cuenta: 22, codigo: '3.1.1', nombre: 'Capital Social', tipo: 'PATRIMONIO', nivel: 3, id_cuenta_padre: 21, permite_movimiento: true },
    { id_cuenta: 30, codigo: '4', nombre: 'INGRESO', tipo: 'INGRESO', nivel: 1, id_cuenta_padre: null, permite_movimiento: false },
    { id_cuenta: 31, codigo: '4.1', nombre: 'Ingresos Operativos', tipo: 'INGRESO', nivel: 2, id_cuenta_padre: 30, permite_movimiento: false },
    { id_cuenta: 32, codigo: '4.1.1', nombre: 'Ventas', tipo: 'INGRESO', nivel: 3, id_cuenta_padre: 31, permite_movimiento: true },
    { id_cuenta: 40, codigo: '5', nombre: 'GASTO', tipo: 'GASTO', nivel: 1, id_cuenta_padre: null, permite_movimiento: false },
    { id_cuenta: 41, codigo: '5.1', nombre: 'Gastos Operativos', tipo: 'GASTO', nivel: 2, id_cuenta_padre: 40, permite_movimiento: false },
    { id_cuenta: 42, codigo: '5.1.1', nombre: 'Sueldos', tipo: 'GASTO', nivel: 3, id_cuenta_padre: 41, permite_movimiento: true },
    { id_cuenta: 43, codigo: '5.1.2', nombre: 'Alquileres', tipo: 'GASTO', nivel: 3, id_cuenta_padre: 41, permite_movimiento: true },
  ];
}

const filtros = { fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' };

// ── Balance General ─────────────────────────────────────────────────

describe('ReporteService — generarBalanceGeneral', () => {
  it('propaga saldos de hojas a padres y verifica ecuación A = P + E', async () => {
    // Escenario: Caja 5000 (D), CxC 2000 (D), CxP 3000 (H), Capital 4000 (H)
    const totales = [
      { id_cuenta: 3, total_debe: 5000, total_haber: 0 },
      { id_cuenta: 4, total_debe: 2000, total_haber: 0 },
      { id_cuenta: 12, total_debe: 0, total_haber: 3000 },
      { id_cuenta: 22, total_debe: 0, total_haber: 4000 },
    ];

    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    // Activo: Caja(5000) + CxC(2000) = 7000
    expect(result.validacion.total_activo).toBe(7000);
    // Pasivo: CxP(3000)
    expect(result.validacion.total_pasivo).toBe(3000);
    // Patrimonio: Capital(4000)
    expect(result.validacion.total_patrimonio).toBe(4000);
    // A = P + E → 7000 = 3000 + 4000 ✓
    expect(result.validacion.pasivo_mas_patrimonio).toBe(7000);
    expect(result.validacion.ecuacion_cumplida).toBe(true);
  });

  it('detecta cuando la ecuación contable NO se cumple', async () => {
    // Escenario desbalanceado: solo Activo, sin pasivo ni patrimonio.
    const totales = [
      { id_cuenta: 3, total_debe: 1000, total_haber: 0 },
    ];

    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    expect(result.validacion.total_activo).toBe(1000);
    expect(result.validacion.pasivo_mas_patrimonio).toBe(0);
    expect(result.validacion.ecuacion_cumplida).toBe(false);
  });

  it('propaga correctamente con múltiples hojas en el mismo grupo', async () => {
    // Caja 300, CxC 200 → Activo Corriente debe ser 500 → ACTIVO raíz 500
    const totales = [
      { id_cuenta: 3, total_debe: 300, total_haber: 0 },
      { id_cuenta: 4, total_debe: 200, total_haber: 0 },
      { id_cuenta: 22, total_debe: 0, total_haber: 500 },
    ];

    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    // Buscar el nodo "Activo Corriente" (1.1) en las cuentas
    const activoCorriente = result.cuentas.find((c) => c.codigo === '1.1');
    expect(activoCorriente.saldo).toBe(500);

    expect(result.validacion.total_activo).toBe(500);
    expect(result.validacion.ecuacion_cumplida).toBe(true);
  });

  it('purga cuentas sin saldo del reporte', async () => {
    // Solo Caja tiene saldo → Pasivo/Patrimonio no deberían aparecer
    const totales = [
      { id_cuenta: 3, total_debe: 100, total_haber: 0 },
    ];

    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    // Solo deben aparecer: ACTIVO (raíz), Activo Corriente, Caja
    expect(result.cuentas).toHaveLength(3);
    const codigos = result.cuentas.map((c) => c.codigo);
    expect(codigos).toContain('1');
    expect(codigos).toContain('1.1');
    expect(codigos).toContain('1.1.1');
    // No deben aparecer pasivo ni patrimonio
    expect(codigos).not.toContain('2');
    expect(codigos).not.toContain('3');
  });

  it('maneja período sin movimientos', async () => {
    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue([]) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    expect(result.cuentas).toHaveLength(0);
    expect(result.validacion.total_activo).toBe(0);
    expect(result.validacion.ecuacion_cumplida).toBe(true); // 0 = 0 + 0
  });

  it('evita errores de punto flotante en propagación', async () => {
    const totales = [
      { id_cuenta: 3, total_debe: 0.1, total_haber: 0 },
      { id_cuenta: 4, total_debe: 0.2, total_haber: 0 },
      { id_cuenta: 22, total_debe: 0, total_haber: 0.3 },
    ];

    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    // Sin money.js: 0.1 + 0.2 = 0.30000000000000004
    expect(result.validacion.total_activo).toBe(0.3);
    expect(result.validacion.total_patrimonio).toBe(0.3);
    expect(result.validacion.ecuacion_cumplida).toBe(true);
  });
  it('incorpora el resultado del ejercicio al patrimonio (cuadra antes del cierre)', async () => {
    // Activo: Caja 1000. Patrimonio: Capital 600. Resultado: Ventas 400.
    // Patrimonio efectivo = 600 + 400 = 1000 = Activo.
    const totales = [
      { id_cuenta: 3, total_debe: 1000, total_haber: 0 },
      { id_cuenta: 22, total_debe: 0, total_haber: 600 },
      { id_cuenta: 32, total_debe: 0, total_haber: 400 },
    ];
    const reporteRepo = { getTotalesAcumulados: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarBalanceGeneral(filtros);

    expect(result.validacion.total_activo).toBe(1000);
    expect(result.validacion.total_patrimonio).toBe(600);
    expect(result.validacion.resultado_ejercicio).toBe(400);
    expect(result.validacion.ecuacion_cumplida).toBe(true);
  });
});

// ── Estado de Resultados ────────────────────────────────────────────

describe('ReporteService — generarEstadoResultados', () => {
  it('calcula utilidad neta (Ingresos > Gastos)', async () => {
    // Ventas 10000, Sueldos 6000, Alquileres 1500
    const totales = [
      { id_cuenta: 32, total_debe: 0, total_haber: 10000 },
      { id_cuenta: 42, total_debe: 6000, total_haber: 0 },
      { id_cuenta: 43, total_debe: 1500, total_haber: 0 },
    ];

    const reporteRepo = { getTotalesPorCuenta: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarEstadoResultados(filtros);

    expect(result.resumen.total_ingresos).toBe(10000);
    expect(result.resumen.total_gastos).toBe(7500);
    expect(result.resumen.utilidad_neta).toBe(2500);
    expect(result.resumen.es_utilidad).toBe(true);
  });

  it('detecta pérdida neta (Gastos > Ingresos)', async () => {
    const totales = [
      { id_cuenta: 32, total_debe: 0, total_haber: 3000 },
      { id_cuenta: 42, total_debe: 5000, total_haber: 0 },
    ];

    const reporteRepo = { getTotalesPorCuenta: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarEstadoResultados(filtros);

    expect(result.resumen.total_ingresos).toBe(3000);
    expect(result.resumen.total_gastos).toBe(5000);
    expect(result.resumen.utilidad_neta).toBe(-2000);
    expect(result.resumen.es_utilidad).toBe(false);
  });

  it('propaga gastos de múltiples hojas al grupo padre', async () => {
    // Sueldos 2000 + Alquileres 1000 → Gastos Operativos (5.1) = 3000
    const totales = [
      { id_cuenta: 42, total_debe: 2000, total_haber: 0 },
      { id_cuenta: 43, total_debe: 1000, total_haber: 0 },
    ];

    const reporteRepo = { getTotalesPorCuenta: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarEstadoResultados(filtros);

    const gastosOp = result.cuentas.find((c) => c.codigo === '5.1');
    expect(gastosOp.saldo).toBe(3000);
  });

  it('no incluye cuentas de ACTIVO/PASIVO/PATRIMONIO', async () => {
    const totales = [
      { id_cuenta: 3, total_debe: 5000, total_haber: 0 },   // Caja (ACTIVO) — no debe aparecer
      { id_cuenta: 32, total_debe: 0, total_haber: 1000 },   // Ventas (INGRESO)
    ];

    const reporteRepo = { getTotalesPorCuenta: jest.fn().mockResolvedValue(totales) };
    const cuentaRepo = { findAll: jest.fn().mockResolvedValue(planDeCuentas()) };
    const service = createReporteService({ reporteRepo, cuentaRepo });

    const result = await service.generarEstadoResultados(filtros);

    const tipos = new Set(result.cuentas.map((c) => c.tipo));
    expect(tipos.has('ACTIVO')).toBe(false);
    expect(tipos.has('PASIVO')).toBe(false);
    expect(tipos.has('PATRIMONIO')).toBe(false);
  });
});
