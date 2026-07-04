import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount, ivaPorDentro } from '../utils/money.js';
import { devolucionRepository } from '../repositories/devolucion.repository.js';
import { ventaRepository } from '../repositories/venta.repository.js';
import { loteRepository } from '../repositories/lote.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';

function cuentaCobro(metodo) {
  return metodo === 'EFECTIVO' ? '1.1.1' : '1.1.2';
}

/**
 * Devoluciones de venta (RF-VEN-03). Al registrar una devolución:
 *   - repone el stock en los lotes originales;
 *   - genera el asiento de reversa (Debe Devoluciones sobre Ventas 4.1.2 + IVA
 *     Débito 2.1.2 · Haber Caja/Bancos), IVA 13% "por dentro";
 *   - marca la venta como DEVOLUCION_PARCIAL.
 */
export function createDevolucionService({
  repo = devolucionRepository,
  ventaRepo = ventaRepository,
  loteRepo = loteRepository,
  cuentaRepo = cuentaRepository,
  asientoService = defaultAsientoService,
} = {}) {
  return {
    async crear({ id_venta, motivo, fecha, lineas } = {}, empleadoId) {
      if (!empleadoId) throw ApiError.badRequest('No se pudo identificar al responsable');
      if (!motivo || !motivo.trim()) throw ApiError.badRequest('El motivo es obligatorio');
      if (!Array.isArray(lineas) || lineas.length === 0) {
        throw ApiError.badRequest('La devolución requiere al menos una línea');
      }

      const venta = await ventaRepo.findById(id_venta);
      if (!venta) throw ApiError.notFound('Venta no encontrada');
      if (venta.estado === 'ANULADA') throw ApiError.conflict('La venta está anulada');

      const detallesVenta = new Map(venta.detalles.map((d) => [d.id_detalle, d]));

      let refundCents = 0;
      const detalleRows = [];
      const reposiciones = [];
      for (const l of lineas) {
        const dv = detallesVenta.get(l.id_detalle_venta);
        if (!dv) throw ApiError.badRequest(`La línea ${l.id_detalle_venta} no pertenece a la venta`);
        if (l.cantidad_dev <= 0) throw ApiError.badRequest('La cantidad a devolver debe ser mayor a cero');
        if (l.cantidad_dev > dv.cantidad) {
          throw ApiError.badRequest(`No se pueden devolver más unidades de las vendidas (línea ${l.id_detalle_venta})`);
        }
        refundCents += toCents(dv.precio_unitario) * l.cantidad_dev;
        detalleRows.push({ id_detalle_venta: dv.id_detalle, cantidad_dev: l.cantidad_dev });
        reposiciones.push({ id_lote: dv.id_lote, cantidad: l.cantidad_dev });
      }

      const montoDevuelto = centsToAmount(refundCents);
      if (montoDevuelto <= 0) throw ApiError.badRequest('El monto a devolver debe ser mayor a cero');
      const fechaDev = fecha || new Date().toISOString().slice(0, 10);

      // 1) Devolución + detalle + reposición de stock + estado de la venta (atómico).
      const idDev = await ventaRepo.transaction(async (t) => {
        const devolucion = await repo.crearDevolucion(
          { id_venta, id_empleado: empleadoId, fecha: fechaDev, motivo: motivo.trim(), monto_total: montoDevuelto },
          t,
        );
        await repo.crearDetalles(
          detalleRows.map((d) => ({ ...d, id_devolucion: devolucion.id_devolucion })),
          t,
        );
        for (const r of reposiciones) {
          await loteRepo.reponer(r.id_lote, r.cantidad, t);
        }
        await venta.update({ estado: 'DEVOLUCION_PARCIAL' }, { transaction: t });
        return devolucion.id_devolucion;
      });

      // 2) Asiento de reversa.
      const { total, neto, iva } = ivaPorDentro(montoDevuelto);
      const codigoCobro = cuentaCobro(venta.metodo_pago);
      const codigos = ['4.1.2', '2.1.2', codigoCobro];
      const cuentasDb = await cuentaRepo.findByCodigos(codigos);
      const porCodigo = Object.create(null);
      for (const c of cuentasDb) porCodigo[c.codigo] = c;
      for (const codigo of codigos) {
        if (!porCodigo[codigo]) throw ApiError.badRequest(`Cuenta contable ${codigo} no encontrada`);
      }

      const asiento = await asientoService.crear({
        id_sucursal: venta.id_sucursal,
        fecha: fechaDev,
        concepto: `Devolución de venta ${venta.numero_venta}`,
        tipo_origen: 'DEVOLUCION',
        id_referencia: id_venta,
        estado: 'CONFIRMADO',
        lineas: [
          { id_cuenta: porCodigo['4.1.2'].id_cuenta, descripcion: 'Reverso de ingreso por devolución', debe: neto, haber: 0 },
          { id_cuenta: porCodigo['2.1.2'].id_cuenta, descripcion: 'Reverso IVA Débito Fiscal', debe: iva, haber: 0 },
          { id_cuenta: porCodigo[codigoCobro].id_cuenta, descripcion: 'Reembolso al cliente', debe: 0, haber: total },
        ],
      });

      const devolucion = await repo.findById(idDev);
      await devolucion.update({ id_asiento_devolucion: asiento.id_asiento });
      return repo.findById(idDev);
    },
  };
}

export const devolucionService = createDevolucionService();
