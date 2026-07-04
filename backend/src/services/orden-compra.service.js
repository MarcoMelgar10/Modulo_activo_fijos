import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { ordenCompraRepository } from '../repositories/orden-compra.repository.js';
import { proveedorRepository } from '../repositories/proveedor.repository.js';
import { productoRepository } from '../repositories/producto.repository.js';
import { loteRepository } from '../repositories/lote.repository.js';
import { cuentaPorPagarRepository } from '../repositories/cuenta-por-pagar.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';

const IVA_RATE = 13;

// Suma un año a una fecha AAAA-MM-DD (vencimiento por defecto de un lote).
function unAnioDespues(fechaStr) {
  const d = new Date(fechaStr);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Descompone un monto que ya incluye IVA (cálculo "por dentro", Bolivia 13%).
 * neto + iva === total, sin residuo de redondeo.
 */
function descomponerIva(montoTotal) {
  const totalCents = toCents(montoTotal);
  const ivaCents = Math.round((totalCents * IVA_RATE) / 100);
  const netoCents = totalCents - ivaCents;
  return { total: centsToAmount(totalCents), neto: centsToAmount(netoCents), iva: centsToAmount(ivaCents) };
}

/**
 * Órdenes de compra (RF-COM-02) y recepción de mercancía (RF-COM-03).
 * Ciclo: BORRADOR → ENVIADA → RECIBIDA (o CANCELADA).
 * En la recepción:
 *   1) se generan lotes de inventario (uno por línea),
 *   2) se genera el asiento contable CONFIRMADO (Inventario + IVA Crédito contra
 *      Caja si es CONTADO, o Cuentas por Pagar si es CREDITO),
 *   3) si es a crédito, se registra la Cuenta por Pagar (RF-COM-04).
 */
export function createOrdenCompraService({
  repo = ordenCompraRepository,
  proveedorRepo = proveedorRepository,
  productoRepo = productoRepository,
  loteRepo = loteRepository,
  cxpRepo = cuentaPorPagarRepository,
  cuentaRepo = cuentaRepository,
  asientoService = defaultAsientoService,
} = {}) {
  async function construirDetalles(lineas) {
    if (!Array.isArray(lineas) || lineas.length === 0) {
      throw ApiError.badRequest('La orden requiere al menos una línea');
    }
    const ids = [...new Set(lineas.map((l) => l.id_producto))];
    const productos = await productoRepo.findByIds(ids);
    const porId = new Map(productos.map((p) => [p.id_producto, p]));

    let totalCents = 0;
    const detalles = lineas.map((l) => {
      const producto = porId.get(l.id_producto);
      if (!producto) throw ApiError.badRequest(`El producto ${l.id_producto} no existe`);
      if (!producto.activo) throw ApiError.badRequest(`El producto ${producto.nombre} está inactivo`);
      if (l.cantidad <= 0) throw ApiError.badRequest('La cantidad debe ser mayor a cero');
      const subtotalCents = toCents(l.precio_unitario) * l.cantidad;
      totalCents += subtotalCents;
      return {
        id_producto: l.id_producto,
        cantidad: l.cantidad,
        precio_unitario: centsToAmount(toCents(l.precio_unitario)),
        subtotal: centsToAmount(subtotalCents),
      };
    });
    return { detalles, monto_total: centsToAmount(totalCents) };
  }

  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const orden = await repo.findById(id);
      if (!orden) throw ApiError.notFound('Orden de compra no encontrada');
      return orden;
    },

    async crear({ id_proveedor, id_sucursal = 1, fecha_emision, condicion_pago = 'CREDITO', lineas }, empleadoId = null) {
      const proveedor = await proveedorRepo.findById(id_proveedor);
      if (!proveedor) throw ApiError.badRequest('El proveedor indicado no existe');
      if (!proveedor.activo) throw ApiError.badRequest('El proveedor está inactivo');

      const { detalles, monto_total } = await construirDetalles(lineas);
      const anio = new Date(fecha_emision).getFullYear();

      const idCreado = await repo.transaction(async (t) => {
        const numero = await repo.siguienteNumero(anio, t);
        const orden = await repo.crearOrden(
          {
            id_proveedor,
            id_sucursal,
            numero_orden: numero,
            fecha_emision,
            condicion_pago,
            estado: 'BORRADOR',
            monto_total,
            id_empleado: empleadoId,
          },
          t,
        );
        await repo.crearDetalles(
          detalles.map((d) => ({ ...d, id_orden: orden.id_orden })),
          t,
        );
        return orden.id_orden;
      });

      return repo.findById(idCreado);
    },

    async enviar(id) {
      const orden = await this.obtener(id);
      if (orden.estado !== 'BORRADOR') {
        throw ApiError.conflict(`Solo se envían órdenes en BORRADOR (actual: ${orden.estado})`);
      }
      await orden.update({ estado: 'ENVIADA' });
      return repo.findById(id);
    },

    async cancelar(id) {
      const orden = await this.obtener(id);
      if (!['BORRADOR', 'ENVIADA'].includes(orden.estado)) {
        throw ApiError.conflict(`No se puede cancelar una orden ${orden.estado}`);
      }
      await orden.update({ estado: 'CANCELADA' });
      return repo.findById(id);
    },

    /**
     * Recepción de mercancía (RF-COM-03). `lotes` es opcional: un arreglo de
     * { id_producto, numero_lote, fecha_vencimiento } para detallar cada lote;
     * si falta un producto, se generan valores por defecto.
     */
    async recibir(id, { fecha_recepcion, lotes = [] } = {}, empleadoId = null) {
      const orden = await this.obtener(id);
      if (orden.estado !== 'ENVIADA') {
        throw ApiError.conflict(`Solo se reciben órdenes ENVIADAS (actual: ${orden.estado})`);
      }
      const fecha = fecha_recepcion || new Date().toISOString().slice(0, 10);

      // --- 1) Asiento contable (IVA 13% por dentro) ---
      const { total, neto, iva } = descomponerIva(orden.monto_total);
      const codigoHaber = orden.condicion_pago === 'CONTADO' ? '1.1.1' : '2.1.1';
      const codigos = ['1.1.4', '1.1.5', codigoHaber];
      const cuentasDb = await cuentaRepo.findByCodigos(codigos);
      const porCodigo = Object.create(null);
      for (const c of cuentasDb) porCodigo[c.codigo] = c;
      for (const codigo of codigos) {
        if (!porCodigo[codigo]) {
          throw ApiError.badRequest(`Cuenta contable ${codigo} no encontrada en el plan de cuentas`);
        }
      }

      const lineasAsiento = [
        { id_cuenta: porCodigo['1.1.4'].id_cuenta, descripcion: 'Ingreso de mercadería al inventario', debe: neto, haber: 0 },
        { id_cuenta: porCodigo['1.1.5'].id_cuenta, descripcion: 'IVA Crédito Fiscal 13%', debe: iva, haber: 0 },
        {
          id_cuenta: porCodigo[codigoHaber].id_cuenta,
          descripcion: orden.condicion_pago === 'CONTADO' ? 'Pago en efectivo' : 'Deuda con proveedor',
          debe: 0,
          haber: total,
        },
      ];

      const asiento = await asientoService.crear({
        id_sucursal: orden.id_sucursal,
        fecha,
        concepto: `Compra OC ${orden.numero_orden} — ${orden.proveedor?.razon_social ?? 'proveedor'}`,
        tipo_origen: 'COMPRA',
        id_referencia: orden.id_orden,
        estado: 'CONFIRMADO',
        lineas: lineasAsiento,
      });

      // --- 2) Lotes de inventario (uno por línea recibida) ---
      const loteRows = orden.detalles.map((d) => {
        const info = lotes.find((l) => Number(l.id_producto) === d.id_producto) || {};
        return {
          id_producto: d.id_producto,
          id_sucursal: orden.id_sucursal,
          id_proveedor: orden.id_proveedor,
          numero_lote: info.numero_lote || `LOTE-${orden.numero_orden}-${d.id_producto}`,
          cantidad_inicial: d.cantidad,
          cantidad_actual: d.cantidad,
          fecha_vencimiento: info.fecha_vencimiento || unAnioDespues(fecha),
          fecha_ingreso: fecha,
          activo: true,
        };
      });
      await loteRepo.bulkCreate(loteRows);

      // --- 3) Cuenta por pagar si la compra es a crédito (RF-COM-04) ---
      if (orden.condicion_pago === 'CREDITO') {
        await cxpRepo.create({
          id_proveedor: orden.id_proveedor,
          id_orden: orden.id_orden,
          id_sucursal: orden.id_sucursal,
          monto_total: total,
          saldo_pendiente: total,
          estado: 'PENDIENTE',
          fecha_emision: fecha,
        });
      }

      await orden.update({
        estado: 'RECIBIDA',
        fecha_recepcion: fecha,
        id_asiento_compra: asiento.id_asiento,
        ...(empleadoId ? { id_empleado: orden.id_empleado ?? empleadoId } : {}),
      });

      return repo.findById(id);
    },
  };
}

export const ordenCompraService = createOrdenCompraService();
