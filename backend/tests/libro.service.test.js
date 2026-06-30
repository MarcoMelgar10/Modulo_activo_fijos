import { describe, it, expect, jest } from '@jest/globals';
import { createLibroService } from '../src/services/libro.service.js';

/**
 * Tests unitarios para el servicio de Libros Contables (Etapa 5).
 * Verifican lógica de negocio con mocks (sin BD).
 */

// ── Helpers para construir datos de prueba ──────────────────────────

function mockLinea({ id_linea = 1, debe = 0, haber = 0, descripcion = null, cuenta = null, asiento = null } = {}) {
  return {
    id_linea,
    debe,
    haber,
    descripcion,
    cuenta: cuenta ?? { id_cuenta: 10, codigo: '1.1.1', nombre: 'Caja', tipo: 'ACTIVO' },
    asiento: asiento ?? {
      id_asiento: 1,
      numero_asiento: 'AST-2026-00001',
      fecha: '2026-06-15',
      concepto: 'Venta contado',
      tipo_origen: 'VENTA',
      sucursal: { id_sucursal: 1, nombre: 'Central' },
    },
  };
}

function mockCuenta({ id_cuenta = 10, codigo = '1.1.1', nombre = 'Caja', tipo = 'ACTIVO' } = {}) {
  return { id_cuenta, codigo, nombre, tipo };
}

// ── Libro Diario ────────────────────────────────────────────────────

describe('LibroService — obtenerLibroDiario', () => {
  it('calcula totales balanceados (Debe === Haber)', async () => {
    const lineas = [
      mockLinea({ id_linea: 1, debe: 1000, haber: 0 }),
      mockLinea({ id_linea: 2, debe: 0, haber: 1000 }),
    ];

    const libroRepo = { getLineasDiario: jest.fn().mockResolvedValue(lineas) };
    const service = createLibroService({ libroRepo, cuentaRepo: {} });

    const result = await service.obtenerLibroDiario({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' });

    expect(result.totales.total_debe).toBe(1000);
    expect(result.totales.total_haber).toBe(1000);
    expect(result.totales.cuadrado).toBe(true);
    expect(result.registros).toHaveLength(2);
  });

  it('detecta descuadre cuando Debe ≠ Haber', async () => {
    const lineas = [
      mockLinea({ id_linea: 1, debe: 500.50, haber: 0 }),
      mockLinea({ id_linea: 2, debe: 0, haber: 400 }),
    ];

    const libroRepo = { getLineasDiario: jest.fn().mockResolvedValue(lineas) };
    const service = createLibroService({ libroRepo, cuentaRepo: {} });

    const result = await service.obtenerLibroDiario({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' });

    expect(result.totales.total_debe).toBe(500.50);
    expect(result.totales.total_haber).toBe(400);
    expect(result.totales.cuadrado).toBe(false);
  });

  it('maneja período sin movimientos', async () => {
    const libroRepo = { getLineasDiario: jest.fn().mockResolvedValue([]) };
    const service = createLibroService({ libroRepo, cuentaRepo: {} });

    const result = await service.obtenerLibroDiario({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31' });

    expect(result.registros).toHaveLength(0);
    expect(result.totales.total_debe).toBe(0);
    expect(result.totales.total_haber).toBe(0);
    expect(result.totales.cuadrado).toBe(true);
  });

  it('evita errores de punto flotante (0.1 + 0.2)', async () => {
    const lineas = [
      mockLinea({ id_linea: 1, debe: 0.1, haber: 0 }),
      mockLinea({ id_linea: 2, debe: 0.2, haber: 0 }),
      mockLinea({ id_linea: 3, debe: 0, haber: 0.3 }),
    ];

    const libroRepo = { getLineasDiario: jest.fn().mockResolvedValue(lineas) };
    const service = createLibroService({ libroRepo, cuentaRepo: {} });

    const result = await service.obtenerLibroDiario({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' });

    // Sin money.js, 0.1+0.2 = 0.30000000000000004 ≠ 0.3
    expect(result.totales.total_debe).toBe(0.3);
    expect(result.totales.total_haber).toBe(0.3);
    expect(result.totales.cuadrado).toBe(true);
  });
});

// ── Libro Mayor ─────────────────────────────────────────────────────

describe('LibroService — obtenerLibroMayor', () => {
  it('calcula saldo acumulado con naturaleza DEUDORA (ACTIVO: Debe - Haber)', async () => {
    const cuenta = mockCuenta({ tipo: 'ACTIVO' });
    const lineas = [
      mockLinea({ id_linea: 1, debe: 500, haber: 0 }),
      mockLinea({ id_linea: 2, debe: 0, haber: 200 }),
      mockLinea({ id_linea: 3, debe: 300, haber: 0 }),
    ];

    const libroRepo = {
      getSaldoAnterior: jest.fn().mockResolvedValue({ total_debe: 1000, total_haber: 0 }),
      getLineasMayor: jest.fn().mockResolvedValue(lineas),
    };
    const cuentaRepo = { findById: jest.fn().mockResolvedValue(cuenta) };
    const service = createLibroService({ libroRepo, cuentaRepo });

    const result = await service.obtenerLibroMayor({
      id_cuenta: 10,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-06-30',
    });

    // Saldo inicial: 1000 - 0 = 1000
    expect(result.saldo_inicial).toBe(1000);
    expect(result.cuenta.naturaleza).toBe('DEUDORA');

    // Movimiento 1: 1000 + (500-0) = 1500
    expect(result.movimientos[0].saldo_acumulado).toBe(1500);
    // Movimiento 2: 1500 + (0-200) = 1300
    expect(result.movimientos[1].saldo_acumulado).toBe(1300);
    // Movimiento 3: 1300 + (300-0) = 1600
    expect(result.movimientos[2].saldo_acumulado).toBe(1600);

    expect(result.saldo_final).toBe(1600);
  });

  it('calcula saldo acumulado con naturaleza ACREEDORA (PASIVO: Haber - Debe)', async () => {
    const cuenta = mockCuenta({ tipo: 'PASIVO', codigo: '2.1.1', nombre: 'Cuentas por Pagar' });
    const lineas = [
      mockLinea({ id_linea: 1, debe: 0, haber: 800 }),
      mockLinea({ id_linea: 2, debe: 300, haber: 0 }),
    ];

    const libroRepo = {
      getSaldoAnterior: jest.fn().mockResolvedValue({ total_debe: 0, total_haber: 500 }),
      getLineasMayor: jest.fn().mockResolvedValue(lineas),
    };
    const cuentaRepo = { findById: jest.fn().mockResolvedValue(cuenta) };
    const service = createLibroService({ libroRepo, cuentaRepo });

    const result = await service.obtenerLibroMayor({
      id_cuenta: 10,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-06-30',
    });

    // Saldo inicial (acreedora): 500 - 0 = 500
    expect(result.saldo_inicial).toBe(500);
    expect(result.cuenta.naturaleza).toBe('ACREEDORA');

    // Movimiento 1: 500 + (800-0) = 1300
    expect(result.movimientos[0].saldo_acumulado).toBe(1300);
    // Movimiento 2: 1300 + (0-300) = 1000
    expect(result.movimientos[1].saldo_acumulado).toBe(1000);

    expect(result.saldo_final).toBe(1000);
  });

  it('aplica naturaleza DEUDORA para cuentas de GASTO', async () => {
    const cuenta = mockCuenta({ tipo: 'GASTO', codigo: '5.1.1', nombre: 'Sueldos' });
    const lineas = [
      mockLinea({ id_linea: 1, debe: 200, haber: 0 }),
    ];

    const libroRepo = {
      getSaldoAnterior: jest.fn().mockResolvedValue({ total_debe: 0, total_haber: 0 }),
      getLineasMayor: jest.fn().mockResolvedValue(lineas),
    };
    const cuentaRepo = { findById: jest.fn().mockResolvedValue(cuenta) };
    const service = createLibroService({ libroRepo, cuentaRepo });

    const result = await service.obtenerLibroMayor({
      id_cuenta: 10,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-06-30',
    });

    expect(result.cuenta.naturaleza).toBe('DEUDORA');
    expect(result.movimientos[0].saldo_acumulado).toBe(200);
  });

  it('aplica naturaleza ACREEDORA para PATRIMONIO e INGRESO', async () => {
    for (const tipo of ['PATRIMONIO', 'INGRESO']) {
      const cuenta = mockCuenta({ tipo });
      const lineas = [
        mockLinea({ id_linea: 1, debe: 0, haber: 100 }),
      ];

      const libroRepo = {
        getSaldoAnterior: jest.fn().mockResolvedValue({ total_debe: 0, total_haber: 0 }),
        getLineasMayor: jest.fn().mockResolvedValue(lineas),
      };
      const cuentaRepo = { findById: jest.fn().mockResolvedValue(cuenta) };
      const service = createLibroService({ libroRepo, cuentaRepo });

      const result = await service.obtenerLibroMayor({
        id_cuenta: 10,
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
      });

      expect(result.cuenta.naturaleza).toBe('ACREEDORA');
      // Acreedora: Haber - Debe = 100 - 0 = 100
      expect(result.movimientos[0].saldo_acumulado).toBe(100);
    }
  });

  it('lanza error 404 si la cuenta no existe', async () => {
    const libroRepo = {};
    const cuentaRepo = { findById: jest.fn().mockResolvedValue(null) };
    const service = createLibroService({ libroRepo, cuentaRepo });

    await expect(
      service.obtenerLibroMayor({ id_cuenta: 999, fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('maneja cuenta sin movimientos previos ni en el período', async () => {
    const cuenta = mockCuenta({ tipo: 'ACTIVO' });

    const libroRepo = {
      getSaldoAnterior: jest.fn().mockResolvedValue({ total_debe: 0, total_haber: 0 }),
      getLineasMayor: jest.fn().mockResolvedValue([]),
    };
    const cuentaRepo = { findById: jest.fn().mockResolvedValue(cuenta) };
    const service = createLibroService({ libroRepo, cuentaRepo });

    const result = await service.obtenerLibroMayor({
      id_cuenta: 10,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2026-06-30',
    });

    expect(result.saldo_inicial).toBe(0);
    expect(result.movimientos).toHaveLength(0);
    expect(result.saldo_final).toBe(0);
  });
});
