import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createAccountingService } from '../src/services/accounting.service.js';

// ---------------------------------------------------------------------------
// Cuentas de referencia del plan de cuentas (seeder Etapa 2).
// ---------------------------------------------------------------------------
const cuentasDb = [
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
  { id_cuenta: 6, codigo: '1.1.4', nombre: 'Inventario de Mercaderías', permite_movimiento: true },
  { id_cuenta: 7, codigo: '1.1.5', nombre: 'IVA Crédito Fiscal', permite_movimiento: true },
  { id_cuenta: 13, codigo: '2.1.1', nombre: 'Cuentas por Pagar', permite_movimiento: true },
  { id_cuenta: 14, codigo: '2.1.2', nombre: 'IVA Débito Fiscal', permite_movimiento: true },
  { id_cuenta: 24, codigo: '4.1.1', nombre: 'Ventas', permite_movimiento: true },
];

function buildDeps() {
  const cuentaRepo = {
    findByCodigos: jest.fn().mockResolvedValue(cuentasDb),
  };
  const asientoService = {
    crear: jest.fn().mockImplementation(async (data) => ({
      id_asiento: 1,
      numero_asiento: 'AST-2026-00001',
      estado: data.estado,
      concepto: data.concepto,
      tipo_origen: data.tipo_origen,
      id_referencia: data.id_referencia,
      lineas: data.lineas,
    })),
  };
  return { cuentaRepo, asientoService };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AccountingService', () => {
  let service;
  let deps;

  beforeEach(() => {
    deps = buildDeps();
    service = createAccountingService(deps);
  });

  // ---- 1. Distribución 87%/13% de VENTA ------------------------------------

  describe('Estrategia VENTA', () => {
    const payload = {
      tipo: 'VENTA',
      fecha: '2026-06-15',
      referencia_id: 1001,
      monto_total: 1000,
      sucursal_id: 1,
    };

    it('distribuye correctamente el 87% (neto) y 13% (IVA) en las cuentas correctas', async () => {
      await service.procesarEvento(payload);

      const { lineas } = deps.asientoService.crear.mock.calls[0][0];

      // Debe: Caja 1.1.1 → 100% del monto bruto.
      const lineaCaja = lineas.find((l) => l.id_cuenta === 3);
      expect(lineaCaja.debe).toBe(1000);
      expect(lineaCaja.haber).toBe(0);

      // Haber: Ventas 4.1.1 → 87%.
      const lineaVentas = lineas.find((l) => l.id_cuenta === 24);
      expect(lineaVentas.haber).toBe(870);
      expect(lineaVentas.debe).toBe(0);

      // Haber: IVA DF 2.1.2 → 13%.
      const lineaIva = lineas.find((l) => l.id_cuenta === 14);
      expect(lineaIva.haber).toBe(130);
      expect(lineaIva.debe).toBe(0);
    });

    it('genera líneas donde Σdebe === Σhaber (partida doble)', async () => {
      await service.procesarEvento(payload);

      const { lineas } = deps.asientoService.crear.mock.calls[0][0];
      const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
      const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
      expect(totalDebe).toBe(totalHaber);
    });

    it('crea el asiento directamente como CONFIRMADO (atomicidad)', async () => {
      await service.procesarEvento(payload);

      const data = deps.asientoService.crear.mock.calls[0][0];
      expect(data.estado).toBe('CONFIRMADO');
      expect(data.tipo_origen).toBe('VENTA');
      expect(data.id_referencia).toBe(1001);
    });

    it('usa batch lookup con findByCodigos en lugar de consultas individuales', async () => {
      await service.procesarEvento(payload);

      expect(deps.cuentaRepo.findByCodigos).toHaveBeenCalledTimes(1);
      expect(deps.cuentaRepo.findByCodigos).toHaveBeenCalledWith(['1.1.1', '4.1.1', '2.1.2']);
    });
  });

  // ---- 2. Tipo de evento inválido -------------------------------------------

  it('rechaza un tipo de evento no soportado', async () => {
    await expect(
      service.procesarEvento({
        tipo: 'TRANSFERENCIA',
        fecha: '2026-06-15',
        referencia_id: 1,
        monto_total: 100,
        sucursal_id: 1,
      }),
    ).rejects.toThrow(/no soportado/);
  });

  // ---- 3. Propagación de error de balance -----------------------------------

  it('propaga el error si asientoService.crear detecta un desbalance', async () => {
    deps.asientoService.crear.mockRejectedValue(new Error('El asiento no está balanceado'));

    await expect(
      service.procesarEvento({
        tipo: 'VENTA',
        fecha: '2026-06-15',
        referencia_id: 1,
        monto_total: 100,
        sucursal_id: 1,
      }),
    ).rejects.toThrow(/no está balanceado/);
  });

  // ---- Estrategia COMPRA ----------------------------------------------------

  describe('Estrategia COMPRA', () => {
    it('distribuye 87% inventario + 13% IVA CF y acredita 100% a Caja', async () => {
      await service.procesarEvento({
        tipo: 'COMPRA',
        fecha: '2026-06-15',
        referencia_id: 501,
        monto_total: 5000,
        sucursal_id: 1,
      });

      const { lineas } = deps.asientoService.crear.mock.calls[0][0];
      const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
      const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
      expect(totalDebe).toBe(totalHaber);
      expect(totalDebe).toBe(5000);
    });
  });

  // ---- Estrategia PAGO ------------------------------------------------------

  describe('Estrategia PAGO', () => {
    it('debita Cuentas por Pagar y acredita Caja por el 100%', async () => {
      await service.procesarEvento({
        tipo: 'PAGO',
        fecha: '2026-06-15',
        referencia_id: 301,
        monto_total: 3000,
        sucursal_id: 1,
      });

      const { lineas } = deps.asientoService.crear.mock.calls[0][0];

      const lineaCtaPagar = lineas.find((l) => l.id_cuenta === 13);
      expect(lineaCtaPagar.debe).toBe(3000);

      const lineaCaja = lineas.find((l) => l.id_cuenta === 3);
      expect(lineaCaja.haber).toBe(3000);
    });
  });

  // ---- Cuenta faltante en el plan -------------------------------------------

  it('aborta si una cuenta requerida no existe en el plan de cuentas', async () => {
    deps.cuentaRepo.findByCodigos.mockResolvedValue([
      { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
    ]);

    await expect(
      service.procesarEvento({
        tipo: 'VENTA',
        fecha: '2026-06-15',
        referencia_id: 1,
        monto_total: 100,
        sucursal_id: 1,
      }),
    ).rejects.toThrow(/no encontrada/);
  });

  // ---- Cuenta que no permite movimiento -------------------------------------

  it('rechaza cuentas de agrupación que no permiten movimiento', async () => {
    deps.cuentaRepo.findByCodigos.mockResolvedValue([
      { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
      { id_cuenta: 24, codigo: '4.1.1', nombre: 'Ventas', permite_movimiento: false },
      { id_cuenta: 14, codigo: '2.1.2', nombre: 'IVA DF', permite_movimiento: true },
    ]);

    await expect(
      service.procesarEvento({
        tipo: 'VENTA',
        fecha: '2026-06-15',
        referencia_id: 1,
        monto_total: 100,
        sucursal_id: 1,
      }),
    ).rejects.toThrow(/agrupación/);
  });

  // ---- Monto con centavos difíciles (redondeo) ------------------------------

  it('mantiene el balance exacto incluso con montos que generan centavos fraccionarios', async () => {
    await service.procesarEvento({
      tipo: 'VENTA',
      fecha: '2026-06-15',
      referencia_id: 99,
      monto_total: 99.99,
      sucursal_id: 1,
    });

    const { lineas } = deps.asientoService.crear.mock.calls[0][0];
    const totalDebe = Math.round(lineas.reduce((s, l) => s + l.debe, 0) * 100);
    const totalHaber = Math.round(lineas.reduce((s, l) => s + l.haber, 0) * 100);
    expect(totalDebe).toBe(totalHaber);
  });
});
