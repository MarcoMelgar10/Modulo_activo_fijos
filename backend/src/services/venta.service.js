import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount, ivaPorDentro } from '../utils/money.js';
import { ventaRepository } from '../repositories/venta.repository.js';
import { productoRepository } from '../repositories/producto.repository.js';
import { loteRepository } from '../repositories/lote.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';

// Cuenta de cobro según el método de pago (Efectivo → Caja; tarjeta/QR → Bancos).
function cuentaCobro(metodo) {
  return metodo === 'EFECTIVO' ? '1.1.1' : '1.1.2';
}

const round2 = (n) => Number(n.toFixed(2));

/**
 * Ventas POS (RF-VEN-01/02) y reportes de ventas (RF-VEN-04).
 * Al registrar una venta:
 *   - descuenta el stock por **FEFO** (lotes con vencimiento más próximo primero)
 *     en la sucursal activa; una línea puede tomar de varios lotes;
 *   - calcula subtotal, aplica el descuento y registra el método de pago;
 *   - genera el asiento contable CONFIRMADO (Debe Caja/Bancos · Haber Ventas + IVA
 *     Débito, IVA 13% "por dentro").
 */
export function createVentaService({
  repo = ventaRepository,
  productoRepo = productoRepository,
  loteRepo = loteRepository,
  cuentaRepo = cuentaRepository,
  asientoService = defaultAsientoService,
} = {}) {
  // Planifica el consumo FEFO (solo lectura): arma las líneas de detalle y la
  // lista de consumos por lote. Falla si no hay stock suficiente.
  async function planificarFEFO(lineas, id_sucursal) {
    const ids = [...new Set(lineas.map((l) => l.id_producto))];
    const productos = await productoRepo.findByIds(ids);
    const porId = new Map(productos.map((p) => [p.id_producto, p]));

    const detalles = [];
    const consumos = [];
    for (const l of lineas) {
      const prod = porId.get(l.id_producto);
      if (!prod) throw ApiError.badRequest(`El producto ${l.id_producto} no existe`);
      if (!prod.activo) throw ApiError.badRequest(`El producto ${prod.nombre} está inactivo`);
      if (l.cantidad <= 0) throw ApiError.badRequest('La cantidad debe ser mayor a cero');

      const precioCents = toCents(l.precio_unitario != null ? l.precio_unitario : prod.precio_venta);
      const lotes = await loteRepo.findDisponiblesFEFO({ id_producto: l.id_producto, id_sucursal });
      let restante = l.cantidad;
      for (const lote of lotes) {
        if (restante <= 0) break;
        const toma = Math.min(restante, lote.cantidad_actual);
        detalles.push({
          id_lote: lote.id_lote,
          id_producto: l.id_producto,
          cantidad: toma,
          precio_unitario: centsToAmount(precioCents),
          subtotal: centsToAmount(precioCents * toma),
        });
        consumos.push({ id_lote: lote.id_lote, cantidad: toma });
        restante -= toma;
      }
      if (restante > 0) {
        throw ApiError.badRequest(`Stock insuficiente para ${prod.nombre} (faltan ${restante} unidades)`);
      }
    }
    return { detalles, consumos };
  }

  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const venta = await repo.findById(id);
      if (!venta) throw ApiError.notFound('Venta no encontrada');
      return venta;
    },

    async crear({ id_sucursal = 1, fecha, metodo_pago = 'EFECTIVO', descuento = 0, lineas }, cajeroId) {
      if (!Array.isArray(lineas) || lineas.length === 0) {
        throw ApiError.badRequest('La venta requiere al menos una línea');
      }
      if (!cajeroId) throw ApiError.badRequest('No se pudo identificar al cajero');

      const fechaVenta = fecha || new Date().toISOString().slice(0, 10);
      const { detalles, consumos } = await planificarFEFO(lineas, id_sucursal);

      const subtotalCents = detalles.reduce((s, d) => s + toCents(d.subtotal), 0);
      const descuentoCents = toCents(descuento);
      if (descuentoCents < 0) throw ApiError.badRequest('El descuento no puede ser negativo');
      if (descuentoCents > subtotalCents) throw ApiError.badRequest('El descuento no puede superar el subtotal');
      const totalCents = subtotalCents - descuentoCents;
      if (totalCents <= 0) throw ApiError.badRequest('El total de la venta debe ser mayor a cero');

      const monto_subtotal = centsToAmount(subtotalCents);
      const monto_descuento = centsToAmount(descuentoCents);
      const monto_total = centsToAmount(totalCents);

      // 1) Crear la venta, sus líneas y descontar el stock (transacción atómica).
      const idVenta = await repo.transaction(async (t) => {
        const numero = await repo.siguienteNumero(new Date(fechaVenta).getFullYear(), t);
        const venta = await repo.crearVenta(
          {
            id_sucursal,
            id_cajero: cajeroId,
            numero_venta: numero,
            fecha: fechaVenta,
            monto_subtotal,
            monto_descuento,
            monto_total,
            metodo_pago,
            estado: 'COMPLETADA',
          },
          t,
        );
        await repo.crearDetalles(
          detalles.map((d) => ({ ...d, id_venta: venta.id_venta })),
          t,
        );
        for (const c of consumos) {
          await loteRepo.descontar(c.id_lote, c.cantidad, t);
        }
        return venta.id_venta;
      });

      // 2) Asiento contable de la venta (fuera de la transacción, como el resto del
      //    proyecto). El cobro va a Caja (efectivo) o Bancos (tarjeta/QR).
      const { total, neto, iva } = ivaPorDentro(monto_total);
      const codigoCobro = cuentaCobro(metodo_pago);
      const codigos = [codigoCobro, '4.1.1', '2.1.2'];
      const cuentasDb = await cuentaRepo.findByCodigos(codigos);
      const porCodigo = Object.create(null);
      for (const c of cuentasDb) porCodigo[c.codigo] = c;
      for (const codigo of codigos) {
        if (!porCodigo[codigo]) throw ApiError.badRequest(`Cuenta contable ${codigo} no encontrada`);
      }

      const venta = await repo.findById(idVenta);
      const asiento = await asientoService.crear({
        id_sucursal,
        fecha: fechaVenta,
        concepto: `Venta ${venta.numero_venta}`,
        tipo_origen: 'VENTA',
        id_referencia: idVenta,
        estado: 'CONFIRMADO',
        lineas: [
          { id_cuenta: porCodigo[codigoCobro].id_cuenta, descripcion: metodo_pago === 'EFECTIVO' ? 'Cobro en caja' : 'Cobro en bancos', debe: total, haber: 0 },
          { id_cuenta: porCodigo['4.1.1'].id_cuenta, descripcion: 'Ingreso por ventas', debe: 0, haber: neto },
          { id_cuenta: porCodigo['2.1.2'].id_cuenta, descripcion: 'IVA Débito Fiscal 13%', debe: 0, haber: iva },
        ],
      });

      await venta.update({ id_asiento_venta: asiento.id_asiento });
      return repo.findById(idVenta);
    },

    // ---- Reporte de ventas (RF-VEN-04) ----
    async reporte(filtros = {}) {
      const ventas = await repo.findAll(filtros);
      const validas = ventas.filter((v) => v.estado !== 'ANULADA');

      const totales = { cantidad: validas.length, subtotal: 0, descuento: 0, total: 0 };
      const porSucursal = new Map();
      for (const v of validas) {
        totales.subtotal += Number(v.monto_subtotal);
        totales.descuento += Number(v.monto_descuento);
        totales.total += Number(v.monto_total);
        const cur = porSucursal.get(v.id_sucursal) || {
          id_sucursal: v.id_sucursal,
          sucursal: v.sucursal?.nombre ?? `Sucursal ${v.id_sucursal}`,
          cantidad: 0,
          total: 0,
        };
        cur.cantidad += 1;
        cur.total += Number(v.monto_total);
        porSucursal.set(v.id_sucursal, cur);
      }

      return {
        totales: {
          cantidad: totales.cantidad,
          subtotal: round2(totales.subtotal),
          descuento: round2(totales.descuento),
          total: round2(totales.total),
        },
        porSucursal: [...porSucursal.values()].map((s) => ({ ...s, total: round2(s.total) })),
        ventas: validas,
      };
    },
  };
}

export const ventaService = createVentaService();
