import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { libroRepository } from '../repositories/libro.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';

/** Tipos de cuenta con naturaleza deudora (Saldo = Debe − Haber). */
const NATURALEZA_DEUDORA = new Set(['ACTIVO', 'GASTO']);

/**
 * Factory del servicio de Libros Contables (Diario y Mayor).
 * Recibe repositorios por inyección para facilitar tests unitarios con mocks.
 */
export function createLibroService({ libroRepo = libroRepository, cuentaRepo = cuentaRepository } = {}) {
  return {
    /**
     * Libro Diario: devuelve líneas confirmadas del período con totales generales.
     * Los totales se calculan en centavos para evitar errores de punto flotante.
     */
    async obtenerLibroDiario(filtros) {
      const lineas = await libroRepo.getLineasDiario(filtros);

      let totalDebeCents = 0;
      let totalHaberCents = 0;

      const registros = lineas.map((l) => {
        const debe = Number(l.debe);
        const haber = Number(l.haber);
        totalDebeCents += toCents(debe);
        totalHaberCents += toCents(haber);

        return {
          id_linea: l.id_linea,
          debe,
          haber,
          descripcion: l.descripcion,
          cuenta: l.cuenta
            ? { id_cuenta: l.cuenta.id_cuenta, codigo: l.cuenta.codigo, nombre: l.cuenta.nombre, tipo: l.cuenta.tipo }
            : null,
          asiento: l.asiento
            ? {
                id_asiento: l.asiento.id_asiento,
                numero_asiento: l.asiento.numero_asiento,
                fecha: l.asiento.fecha,
                concepto: l.asiento.concepto,
                tipo_origen: l.asiento.tipo_origen,
                sucursal: l.asiento.sucursal ?? null,
              }
            : null,
        };
      });

      return {
        registros,
        totales: {
          total_debe: centsToAmount(totalDebeCents),
          total_haber: centsToAmount(totalHaberCents),
          cuadrado: totalDebeCents === totalHaberCents,
        },
      };
    },

    /**
     * Libro Mayor: saldo inicial + movimientos con saldo acumulado dinámico.
     *
     * Regla de naturaleza:
     *  - Deudora (ACTIVO, GASTO): saldo = Debe − Haber
     *  - Acreedora (PASIVO, PATRIMONIO, INGRESO): saldo = Haber − Debe
     */
    async obtenerLibroMayor(filtros) {
      const cuenta = await cuentaRepo.findById(filtros.id_cuenta);
      if (!cuenta) throw ApiError.notFound('Cuenta contable no encontrada');

      // 1. Saldo anterior a fecha_inicio (en centavos).
      const anterior = await libroRepo.getSaldoAnterior(filtros);
      const esDeudora = NATURALEZA_DEUDORA.has(cuenta.tipo);

      const saldoInicialCents = esDeudora
        ? toCents(anterior.total_debe) - toCents(anterior.total_haber)
        : toCents(anterior.total_haber) - toCents(anterior.total_debe);

      // 2. Líneas del período.
      const lineas = await libroRepo.getLineasMayor(filtros);

      let acumuladoCents = saldoInicialCents;

      const movimientos = lineas.map((l) => {
        const debe = Number(l.debe);
        const haber = Number(l.haber);

        const movimientoCents = esDeudora
          ? toCents(debe) - toCents(haber)
          : toCents(haber) - toCents(debe);

        acumuladoCents += movimientoCents;

        return {
          id_linea: l.id_linea,
          debe,
          haber,
          descripcion: l.descripcion,
          saldo_acumulado: centsToAmount(acumuladoCents),
          asiento: l.asiento
            ? {
                id_asiento: l.asiento.id_asiento,
                numero_asiento: l.asiento.numero_asiento,
                fecha: l.asiento.fecha,
                concepto: l.asiento.concepto,
                tipo_origen: l.asiento.tipo_origen,
                sucursal: l.asiento.sucursal ?? null,
              }
            : null,
        };
      });

      return {
        cuenta: {
          id_cuenta: cuenta.id_cuenta,
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipo: cuenta.tipo,
          naturaleza: esDeudora ? 'DEUDORA' : 'ACREEDORA',
        },
        saldo_inicial: centsToAmount(saldoInicialCents),
        movimientos,
        saldo_final: centsToAmount(acumuladoCents),
      };
    },
  };
}

/** Instancia por defecto (repositorios reales). */
export const libroService = createLibroService();
