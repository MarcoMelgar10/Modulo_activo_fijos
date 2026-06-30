import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';
import { cuentaRepository as defaultCuentaRepo } from '../repositories/cuenta.repository.js';

const IVA_RATE = 13;

// ---------------------------------------------------------------------------
// Utilidades monetarias internas
// ---------------------------------------------------------------------------

/**
 * Calcula montos neto e IVA en centavos a partir del monto bruto.
 * neto + iva === total  (sin residuo de redondeo).
 */
function calcularIva(montoBruto) {
  const totalCents = toCents(montoBruto);
  const ivaCents = Math.round((totalCents * IVA_RATE) / 100);
  const netoCents = totalCents - ivaCents;
  return {
    total: centsToAmount(totalCents),
    neto: centsToAmount(netoCents),
    iva: centsToAmount(ivaCents),
  };
}

// ---------------------------------------------------------------------------
// Estrategias por tipo de evento (OCP)
// ---------------------------------------------------------------------------

const strategies = {
  VENTA: {
    codigos: ['1.1.1', '4.1.1', '2.1.2'],
    buildLineas(payload, cuentas) {
      const { total, neto, iva } = calcularIva(payload.monto_total);
      return [
        { id_cuenta: cuentas['1.1.1'].id_cuenta, descripcion: 'Cobro en caja', debe: total, haber: 0 },
        { id_cuenta: cuentas['4.1.1'].id_cuenta, descripcion: 'Ingreso por ventas', debe: 0, haber: neto },
        { id_cuenta: cuentas['2.1.2'].id_cuenta, descripcion: 'IVA Débito Fiscal 13%', debe: 0, haber: iva },
      ];
    },
    concepto: (p) => p.glosa || `Venta automática — Ref #${p.referencia_id}`,
  },

  COMPRA: {
    codigos: ['1.1.4', '1.1.5', '1.1.1'],
    buildLineas(payload, cuentas) {
      const { total, neto, iva } = calcularIva(payload.monto_total);
      return [
        { id_cuenta: cuentas['1.1.4'].id_cuenta, descripcion: 'Ingreso de mercadería al inventario', debe: neto, haber: 0 },
        { id_cuenta: cuentas['1.1.5'].id_cuenta, descripcion: 'IVA Crédito Fiscal 13%', debe: iva, haber: 0 },
        { id_cuenta: cuentas['1.1.1'].id_cuenta, descripcion: 'Pago en efectivo', debe: 0, haber: total },
      ];
    },
    concepto: (p) => p.glosa || `Compra automática — Ref #${p.referencia_id}`,
  },

  DEVOLUCION: {
    codigos: ['4.1.1', '2.1.2', '1.1.1'],
    buildLineas(payload, cuentas) {
      const { total, neto, iva } = calcularIva(payload.monto_total);
      return [
        { id_cuenta: cuentas['4.1.1'].id_cuenta, descripcion: 'Reverso de ingreso por devolución', debe: neto, haber: 0 },
        { id_cuenta: cuentas['2.1.2'].id_cuenta, descripcion: 'Reverso IVA Débito Fiscal', debe: iva, haber: 0 },
        { id_cuenta: cuentas['1.1.1'].id_cuenta, descripcion: 'Devolución al cliente', debe: 0, haber: total },
      ];
    },
    concepto: (p) => p.glosa || `Devolución automática — Ref #${p.referencia_id}`,
  },

  PAGO: {
    codigos: ['2.1.1', '1.1.1'],
    buildLineas(payload, cuentas) {
      const total = centsToAmount(toCents(payload.monto_total));
      return [
        { id_cuenta: cuentas['2.1.1'].id_cuenta, descripcion: 'Cancelación de cuenta por pagar', debe: total, haber: 0 },
        { id_cuenta: cuentas['1.1.1'].id_cuenta, descripcion: 'Egreso de caja', debe: 0, haber: total },
      ];
    },
    concepto: (p) => p.glosa || `Pago automático — Ref #${p.referencia_id}`,
  },
};

// ---------------------------------------------------------------------------
// Factoría con inyección de dependencias (DIP)
// ---------------------------------------------------------------------------

export function createAccountingService({
  asientoService = defaultAsientoService,
  cuentaRepo = defaultCuentaRepo,
} = {}) {
  return {
    /**
     * Procesa un evento contable entrante, genera el asiento con sus líneas
     * y lo persiste como CONFIRMADO en una sola transacción atómica.
     */
    async procesarEvento(payload) {
      const strategy = strategies[payload.tipo];
      if (!strategy) {
        throw ApiError.badRequest(`Tipo de evento no soportado: ${payload.tipo}`);
      }

      // --- Batch lookup de cuentas (single query) ---
      const cuentasDb = await cuentaRepo.findByCodigos(strategy.codigos);
      const cuentasPorCodigo = Object.create(null);
      for (const c of cuentasDb) {
        cuentasPorCodigo[c.codigo] = c;
      }

      // Validar existencia y permisos de movimiento.
      for (const codigo of strategy.codigos) {
        const cuenta = cuentasPorCodigo[codigo];
        if (!cuenta) {
          throw ApiError.badRequest(`Cuenta contable ${codigo} no encontrada en el plan de cuentas`);
        }
        if (!cuenta.permite_movimiento) {
          throw ApiError.badRequest(
            `La cuenta ${codigo} (${cuenta.nombre}) es de agrupación y no admite movimientos`,
          );
        }
      }

      // --- Construir líneas y crear asiento atómicamente como CONFIRMADO ---
      const lineas = strategy.buildLineas(payload, cuentasPorCodigo);
      const concepto = strategy.concepto(payload);

      const asiento = await asientoService.crear({
        id_sucursal: payload.sucursal_id,
        fecha: payload.fecha,
        concepto,
        tipo_origen: payload.tipo,
        id_referencia: payload.referencia_id,
        estado: 'CONFIRMADO',
        lineas,
      });

      return asiento;
    },
  };
}

export const accountingService = createAccountingService();
