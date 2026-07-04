import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { cuentaPorPagarRepository } from '../repositories/cuenta-por-pagar.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';

/**
 * Cuentas por pagar y sus pagos (RF-COM-04). Cada pago (parcial o total):
 *   - genera un asiento contable CONFIRMADO (Debe Cuentas por Pagar 2.1.1 /
 *     Haber Caja 1.1.1), de modo que se refleja en Libro Diario, Mayor y Balance;
 *   - reduce el saldo pendiente y actualiza el estado (PARCIAL / PAGADA).
 */
export function createCuentaPorPagarService({
  repo = cuentaPorPagarRepository,
  cuentaRepo = cuentaRepository,
  asientoService = defaultAsientoService,
} = {}) {
  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const cxp = await repo.findById(id);
      if (!cxp) throw ApiError.notFound('Cuenta por pagar no encontrada');
      return cxp;
    },

    async registrarPago(id, { monto, fecha_pago, metodo_pago = 'EFECTIVO' } = {}, empleadoId = null) {
      const cxp = await this.obtener(id);
      if (cxp.estado === 'PAGADA') {
        throw ApiError.conflict('La cuenta por pagar ya está saldada');
      }

      const montoCents = toCents(monto);
      const saldoCents = toCents(cxp.saldo_pendiente);
      if (montoCents <= 0) throw ApiError.badRequest('El monto del pago debe ser mayor a cero');
      if (montoCents > saldoCents) {
        throw ApiError.badRequest(
          `El pago (${centsToAmount(montoCents)}) excede el saldo pendiente (${centsToAmount(saldoCents)})`,
        );
      }

      const fecha = fecha_pago || new Date().toISOString().slice(0, 10);
      const montoPago = centsToAmount(montoCents);

      // --- Asiento contable del pago (Cuentas por Pagar / Caja) ---
      const codigos = ['2.1.1', '1.1.1'];
      const cuentasDb = await cuentaRepo.findByCodigos(codigos);
      const porCodigo = Object.create(null);
      for (const c of cuentasDb) porCodigo[c.codigo] = c;
      for (const codigo of codigos) {
        if (!porCodigo[codigo]) {
          throw ApiError.badRequest(`Cuenta contable ${codigo} no encontrada en el plan de cuentas`);
        }
      }

      const asiento = await asientoService.crear({
        id_sucursal: cxp.id_sucursal ?? 1,
        fecha,
        concepto: `Pago a proveedor ${cxp.proveedor?.razon_social ?? ''} — CxP #${cxp.id_cxp}`.trim(),
        tipo_origen: 'PAGO',
        id_referencia: cxp.id_cxp,
        estado: 'CONFIRMADO',
        lineas: [
          { id_cuenta: porCodigo['2.1.1'].id_cuenta, descripcion: 'Cancelación de cuenta por pagar', debe: montoPago, haber: 0 },
          { id_cuenta: porCodigo['1.1.1'].id_cuenta, descripcion: 'Egreso de caja', debe: 0, haber: montoPago },
        ],
      });

      await repo.createPago({
        id_cxp: cxp.id_cxp,
        monto: montoPago,
        fecha_pago: fecha,
        metodo_pago,
        id_asiento: asiento.id_asiento,
        id_empleado: empleadoId,
      });

      const nuevoSaldoCents = saldoCents - montoCents;
      await cxp.update({
        saldo_pendiente: centsToAmount(nuevoSaldoCents),
        estado: nuevoSaldoCents === 0 ? 'PAGADA' : 'PARCIAL',
      });

      return repo.findById(id);
    },
  };
}

export const cuentaPorPagarService = createCuentaPorPagarService();
