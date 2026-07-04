import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createCuentaPorPagarService } from '../src/services/cuenta-por-pagar.service.js';

const cuentasDb = [
  { id_cuenta: 13, codigo: '2.1.1', nombre: 'Cuentas por Pagar', permite_movimiento: true },
  { id_cuenta: 3, codigo: '1.1.1', nombre: 'Caja', permite_movimiento: true },
];

function buildDeps(cxp) {
  return {
    repo: {
      findById: jest.fn().mockResolvedValue(cxp),
      createPago: jest.fn().mockResolvedValue({}),
    },
    cuentaRepo: { findByCodigos: jest.fn().mockResolvedValue(cuentasDb) },
    asientoService: { crear: jest.fn().mockImplementation(async (d) => ({ id_asiento: 55, ...d })) },
  };
}

function nuevaCxp(overrides = {}) {
  return {
    id_cxp: 1,
    id_sucursal: 1,
    saldo_pendiente: 1000,
    estado: 'PENDIENTE',
    proveedor: { razon_social: 'ACME' },
    update: jest.fn(),
    ...overrides,
  };
}

describe('CuentaPorPagarService', () => {
  let cxp;
  let deps;
  let service;

  beforeEach(() => {
    cxp = nuevaCxp();
    deps = buildDeps(cxp);
    service = createCuentaPorPagarService(deps);
  });

  it('un pago parcial genera asiento Cuentas por Pagar / Caja y deja saldo PARCIAL', async () => {
    await service.registrarPago(1, { monto: 400, fecha_pago: '2026-07-05' });

    const data = deps.asientoService.crear.mock.calls[0][0];
    expect(data.tipo_origen).toBe('PAGO');
    const debe = data.lineas.find((l) => l.id_cuenta === 13);
    const haber = data.lineas.find((l) => l.id_cuenta === 3);
    expect(debe.debe).toBe(400);
    expect(haber.haber).toBe(400);

    expect(deps.repo.createPago).toHaveBeenCalledTimes(1);
    expect(cxp.update).toHaveBeenCalledWith({ saldo_pendiente: 600, estado: 'PARCIAL' });
  });

  it('un pago total deja la cuenta en PAGADA con saldo 0', async () => {
    await service.registrarPago(1, { monto: 1000, fecha_pago: '2026-07-05' });
    expect(cxp.update).toHaveBeenCalledWith({ saldo_pendiente: 0, estado: 'PAGADA' });
  });

  it('rechaza un pago que excede el saldo pendiente', async () => {
    await expect(service.registrarPago(1, { monto: 1500 })).rejects.toThrow(/excede/);
    expect(deps.asientoService.crear).not.toHaveBeenCalled();
  });

  it('rechaza pagar una cuenta ya saldada', async () => {
    cxp.estado = 'PAGADA';
    await expect(service.registrarPago(1, { monto: 10 })).rejects.toThrow(/saldada/);
  });
});
