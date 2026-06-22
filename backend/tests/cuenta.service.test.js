import { describe, it, expect, jest } from '@jest/globals';
import { createCuentaService } from '../src/services/cuenta.service.js';

const cuenta = (id, codigo, padre = null, nivel = 1) => ({
  id_cuenta: id,
  codigo,
  nombre: codigo,
  tipo: 'ACTIVO',
  id_cuenta_padre: padre,
  nivel,
  permite_movimiento: nivel >= 3,
  toJSON() {
    return { ...this };
  },
});

describe('CuentaService.arbol', () => {
  it('arma la jerarquía padre→subcuentas', async () => {
    const repo = {
      findAll: jest
        .fn()
        .mockResolvedValue([cuenta(1, '1'), cuenta(2, '1.1', 1, 2), cuenta(3, '1.1.1', 2, 3)]),
    };
    const service = createCuentaService({ repo });
    const arbol = await service.arbol();

    expect(arbol).toHaveLength(1);
    expect(arbol[0].subcuentas[0].codigo).toBe('1.1');
    expect(arbol[0].subcuentas[0].subcuentas[0].codigo).toBe('1.1.1');
  });
});

describe('CuentaService.crear', () => {
  it('rechaza código duplicado', async () => {
    const repo = { findByCodigo: jest.fn().mockResolvedValue(cuenta(1, '1.1.1')) };
    const service = createCuentaService({ repo });
    await expect(service.crear({ codigo: '1.1.1', nombre: 'x' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('hereda tipo y nivel del padre y lo convierte en cuenta de agrupación', async () => {
    const padre = { ...cuenta(2, '1.1', 1, 2), permite_movimiento: true, update: jest.fn() };
    const repo = {
      findByCodigo: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(padre),
      create: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    const service = createCuentaService({ repo });

    const creada = await service.crear({ codigo: '1.1.9', nombre: 'Nueva', id_cuenta_padre: 2 });

    expect(creada.nivel).toBe(3);
    expect(creada.tipo).toBe('ACTIVO');
    expect(padre.update).toHaveBeenCalledWith({ permite_movimiento: false });
  });
});

describe('CuentaService.eliminar', () => {
  it('impide eliminar cuentas con subcuentas', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({ ...cuenta(1, '1'), destroy: jest.fn() }),
      countSubcuentas: jest.fn().mockResolvedValue(2),
    };
    const service = createCuentaService({ repo });
    await expect(service.eliminar(1)).rejects.toMatchObject({ statusCode: 409 });
  });
});
