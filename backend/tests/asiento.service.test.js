import { describe, it, expect, jest } from '@jest/globals';
import { validarPartidaDoble, createAsientoService } from '../src/services/asiento.service.js';

describe('validarPartidaDoble', () => {
  it('acepta un asiento balanceado', () => {
    const r = validarPartidaDoble([
      { debe: 100, haber: 0 },
      { debe: 0, haber: 100 },
    ]);
    expect(r).toEqual({ totalDebe: 100, totalHaber: 100 });
  });

  it('rechaza si Debe ≠ Haber', () => {
    expect(() =>
      validarPartidaDoble([
        { debe: 100, haber: 0 },
        { debe: 0, haber: 90 },
      ]),
    ).toThrow(/no está balanceado/);
  });

  it('rechaza una línea con debe y haber a la vez', () => {
    expect(() =>
      validarPartidaDoble([
        { debe: 50, haber: 50 },
        { debe: 0, haber: 100 },
      ]),
    ).toThrow(/Debe o en Haber/);
  });

  it('rechaza menos de dos líneas', () => {
    expect(() => validarPartidaDoble([{ debe: 100, haber: 0 }])).toThrow(/al menos dos/);
  });

  it('rechaza importe total cero', () => {
    expect(() =>
      validarPartidaDoble([
        { debe: 0, haber: 0 },
        { debe: 0, haber: 0 },
      ]),
    ).toThrow();
  });
});

describe('AsientoService.crear', () => {
  const lineasOk = [
    { id_cuenta: 3, debe: 200, haber: 0 },
    { id_cuenta: 4, debe: 0, haber: 200 },
  ];

  function deps({ cuentasHoja = true } = {}) {
    const cuentas = {
      findByIds: jest.fn().mockResolvedValue([
        { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: cuentasHoja },
        { id_cuenta: 4, codigo: '1.1.2', nombre: 'Bancos', permite_movimiento: cuentasHoja },
      ]),
    };
    const repo = {
      transaction: jest.fn(async (fn) => fn('TX')),
      siguienteNumero: jest.fn().mockResolvedValue('AST-2026-00001'),
      crearAsiento: jest.fn().mockResolvedValue({ id_asiento: 10 }),
      crearLineas: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id_asiento: 10, numero_asiento: 'AST-2026-00001' }),
    };
    const cierres = { periodoEstaCerrado: jest.fn().mockResolvedValue(false) };
    return { repo, cuentas, cierres };
  }

  it('crea el asiento en una transacción con numeración correlativa', async () => {
    const d = deps();
    const service = createAsientoService(d);
    const asiento = await service.crear({
      fecha: '2026-06-01',
      concepto: 'Venta',
      lineas: lineasOk,
    });
    expect(asiento.numero_asiento).toBe('AST-2026-00001');
    expect(d.repo.transaction).toHaveBeenCalled();
    expect(d.repo.crearLineas).toHaveBeenCalled();
  });

  it('rechaza cuentas de agrupación (no permiten movimiento)', async () => {
    const d = deps({ cuentasHoja: false });
    const service = createAsientoService(d);
    await expect(
      service.crear({ fecha: '2026-06-01', concepto: 'X', lineas: lineasOk }),
    ).rejects.toThrow(/agrupación/);
  });

  it('rechaza crear un asiento en un período cerrado', async () => {
    const d = deps();
    d.cierres.periodoEstaCerrado.mockResolvedValue(true);
    const service = createAsientoService(d);
    await expect(
      service.crear({ fecha: '2025-06-01', concepto: 'X', lineas: lineasOk }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('AsientoService transiciones de estado', () => {
  function serviceConAsiento(estado) {
    const asiento = {
      id_asiento: 1,
      numero_asiento: 'AST-2026-00001',
      fecha: '2026-06-01',
      estado,
      lineas: [
        { debe: 100, haber: 0 },
        { debe: 0, haber: 100 },
      ],
      update: jest.fn(async function (u) {
        Object.assign(this, u);
      }),
    };
    const repo = { findById: jest.fn().mockResolvedValue(asiento) };
    const cierres = { periodoEstaCerrado: jest.fn().mockResolvedValue(false) };
    return { service: createAsientoService({ repo, cuentas: {}, cierres }), asiento };
  }

  it('confirma un BORRADOR balanceado', async () => {
    const { service, asiento } = serviceConAsiento('BORRADOR');
    await service.confirmar(1);
    expect(asiento.estado).toBe('CONFIRMADO');
  });

  it('no confirma un asiento ya CONFIRMADO', async () => {
    const { service } = serviceConAsiento('CONFIRMADO');
    await expect(service.confirmar(1)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('anula un CONFIRMADO y rechaza anular un BORRADOR', async () => {
    const { service, asiento } = serviceConAsiento('CONFIRMADO');
    await service.anular(1);
    expect(asiento.estado).toBe('ANULADO');

    const borrador = serviceConAsiento('BORRADOR');
    await expect(borrador.service.anular(1)).rejects.toMatchObject({ statusCode: 409 });
  });
});
