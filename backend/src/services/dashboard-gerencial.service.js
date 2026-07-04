import { toCents, centsToAmount } from '../utils/money.js';
import { ventaRepository } from '../repositories/venta.repository.js';
import { ordenCompraRepository } from '../repositories/orden-compra.repository.js';
import { cuentaPorPagarRepository } from '../repositories/cuenta-por-pagar.repository.js';
import { loteRepository } from '../repositories/lote.repository.js';
import { productoRepository } from '../repositories/producto.repository.js';
import { reporteRepository as defaultReporteRepo } from '../repositories/reporte.repository.js';
import { reporteService as defaultReporteService } from './reporte.service.js';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const finDelMes = (anio, mes) => new Date(anio, mes, 0).toISOString().slice(0, 10);
const sumar = (arr, fn) => arr.reduce((a, x) => a + fn(x), 0);

/**
 * Dashboard gerencial (RF-REP-01): KPIs en tiempo real para el GERENTE. Compone
 * los repositorios de los módulos (ventas, compras, cuentas por pagar, inventario)
 * y el resumen financiero del mes. El recuadro de stock es de solo lectura (no es
 * el sistema de alertas automáticas RF-INV-03).
 */
export function createDashboardGerencialService({
  ventaRepo = ventaRepository,
  ordenRepo = ordenCompraRepository,
  cxpRepo = cuentaPorPagarRepository,
  loteRepo = loteRepository,
  productoRepo = productoRepository,
  reporteRepo = defaultReporteRepo,
  reporteService = defaultReporteService,
  diasPorVencer = 30,
} = {}) {
  return {
    async obtener() {
      const hoy = hoyISO();
      const now = new Date();
      const gestion = now.getFullYear();
      const mes = now.getMonth() + 1;
      const inicioMes = `${gestion}-${String(mes).padStart(2, '0')}-01`;
      const finMes = finDelMes(gestion, mes);

      const [ventasHoy, ordenes, cxps, lotes, productos, estadoResultados, iva] = await Promise.all([
        ventaRepo.findAll({ desde: hoy, hasta: hoy }),
        ordenRepo.findAll({}),
        cxpRepo.findAll({}),
        loteRepo.findAll({ activo: true }),
        productoRepo.findAll({ activo: true }),
        reporteService.generarEstadoResultados({ fecha_inicio: inicioMes, fecha_fin: finMes }),
        reporteRepo.getIVAPorPeriodo({ fecha_inicio: inicioMes, fecha_fin: finMes }),
      ]);

      // --- Ventas de hoy (excluye anuladas) ---
      const ventasValidas = ventasHoy.filter((v) => v.estado !== 'ANULADA');
      const ventas_hoy = {
        cantidad: ventasValidas.length,
        total: centsToAmount(sumar(ventasValidas, (v) => toCents(v.monto_total))),
      };

      // --- Órdenes de compra pendientes (BORRADOR / ENVIADA) ---
      const pendientes = ordenes.filter((o) => ['BORRADOR', 'ENVIADA'].includes(o.estado));
      const ordenes_pendientes = {
        cantidad: pendientes.length,
        monto: centsToAmount(sumar(pendientes, (o) => toCents(o.monto_total))),
      };

      // --- Cuentas por pagar abiertas (PENDIENTE / PARCIAL) ---
      const abiertas = cxps.filter((c) => c.estado !== 'PAGADA');
      const cuentas_por_pagar = {
        cantidad: abiertas.length,
        saldo: centsToAmount(sumar(abiertas, (c) => toCents(c.saldo_pendiente))),
      };

      // --- Stock (solo lectura) ---
      const stockPorProducto = new Map();
      for (const l of lotes) {
        stockPorProducto.set(l.id_producto, (stockPorProducto.get(l.id_producto) || 0) + l.cantidad_actual);
      }
      const stock_bajo = productos
        .map((p) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          stock_actual: stockPorProducto.get(p.id_producto) || 0,
          stock_minimo: p.stock_minimo,
        }))
        .filter((p) => p.stock_actual < p.stock_minimo)
        .sort((a, b) => a.stock_actual - b.stock_actual);

      const limite = new Date(now);
      limite.setDate(limite.getDate() + diasPorVencer);
      const limiteStr = limite.toISOString().slice(0, 10);
      const por_vencer = lotes
        .filter((l) => l.cantidad_actual > 0 && l.fecha_vencimiento <= limiteStr)
        .map((l) => ({
          id_lote: l.id_lote,
          producto: l.producto?.nombre ?? `#${l.id_producto}`,
          numero_lote: l.numero_lote,
          fecha_vencimiento: l.fecha_vencimiento,
          cantidad_actual: l.cantidad_actual,
          dias: Math.ceil((new Date(l.fecha_vencimiento) - new Date(hoy)) / 86_400_000),
        }))
        .sort((a, b) => a.dias - b.dias);

      return {
        fecha: hoy,
        gestion,
        mes,
        ventas_hoy,
        ordenes_pendientes,
        cuentas_por_pagar,
        finanzas: {
          utilidad_mes: estadoResultados.resumen.utilidad_neta,
          iva_neto: centsToAmount(toCents(iva.debito) - toCents(iva.credito)),
        },
        stock: { bajo: stock_bajo, por_vencer },
      };
    },
  };
}

export const dashboardGerencialService = createDashboardGerencialService();
