import { Op } from 'sequelize';
import { sequelize, AsientoContable, LineaAsiento, CuentaContable } from '../models/index.js';

/**
 * Repositorio de datos agregados para reportes financieros.
 * Extrae sumatorias de Debe/Haber agrupadas por cuenta.
 */
function sumarPorCuenta(whereAsiento) {
  return LineaAsiento.findAll({
    attributes: [
      'id_cuenta',
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'total_debe'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'total_haber'],
    ],
    include: [{ model: AsientoContable, as: 'asiento', where: whereAsiento, attributes: [] }],
    group: ['id_cuenta'],
    raw: true,
  });
}

const mapTotales = (rows) =>
  rows.map((r) => ({
    id_cuenta: r.id_cuenta,
    total_debe: Number(r.total_debe),
    total_haber: Number(r.total_haber),
  }));

export const reporteRepository = {
  /**
   * Totales por cuenta de los movimientos confirmados DENTRO del rango.
   * Usado por el Estado de Resultados (cuentas de flujo: ingresos/gastos).
   */
  async getTotalesPorCuenta({ fecha_inicio, fecha_fin, id_sucursal }) {
    const whereAsiento = {
      estado: 'CONFIRMADO',
      fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
    };
    if (id_sucursal) whereAsiento.id_sucursal = id_sucursal;
    return mapTotales(await sumarPorCuenta(whereAsiento));
  },

  /**
   * Totales por cuenta ACUMULADOS hasta fecha_fin (sin piso inferior).
   * Usado por el Balance General (cuentas de stock: activo/pasivo/patrimonio),
   * cuyo saldo debe reflejar toda la historia hasta la fecha de corte.
   */
  async getTotalesAcumulados({ fecha_fin, id_sucursal }) {
    const whereAsiento = {
      estado: 'CONFIRMADO',
      fecha: { [Op.lte]: fecha_fin },
    };
    if (id_sucursal) whereAsiento.id_sucursal = id_sucursal;
    return mapTotales(await sumarPorCuenta(whereAsiento));
  },

  /**
   * IVA débito/crédito del período. Busca líneas de cuentas de IVA
   * (2.1.2 Débito Fiscal y 1.1.5 Crédito Fiscal) en asientos confirmados.
   */
  async getIVAPorPeriodo({ fecha_inicio, fecha_fin }) {
    const rows = await LineaAsiento.findAll({
      attributes: [
        'id_cuenta',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'total_debe'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'total_haber'],
      ],
      include: [
        {
          model: AsientoContable,
          as: 'asiento',
          where: { estado: 'CONFIRMADO', fecha: { [Op.between]: [fecha_inicio, fecha_fin] } },
          attributes: [],
        },
        {
          model: CuentaContable,
          as: 'cuenta',
          where: { codigo: { [Op.in]: ['2.1.2', '1.1.5'] } },
          attributes: ['codigo'],
        },
      ],
      group: ['id_cuenta', 'cuenta.codigo'],
      raw: true,
      nest: true,
    });

    let debito = 0;
    let credito = 0;
    for (const r of rows) {
      if (r.cuenta?.codigo === '2.1.2') debito = Number(r.total_haber);
      if (r.cuenta?.codigo === '1.1.5') credito = Number(r.total_debe);
    }
    return { debito, credito };
  },

  // ---- Flujo de Caja (RF-CON-03) ----
  // Cuentas de efectivo/equivalentes: Caja (1.1.1) y Bancos (1.1.2).

  /**
   * Saldo acumulado de las cuentas de caja/bancos hasta una fecha (inclusive).
   * Naturaleza deudora: saldo = Σdebe − Σhaber.
   */
  async getSaldoCajaHasta(fecha) {
    const rows = await LineaAsiento.findAll({
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'total_debe'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'total_haber'],
      ],
      include: [
        { model: AsientoContable, as: 'asiento', where: { estado: 'CONFIRMADO', fecha: { [Op.lte]: fecha } }, attributes: [] },
        { model: CuentaContable, as: 'cuenta', where: { codigo: { [Op.in]: ['1.1.1', '1.1.2'] } }, attributes: [] },
      ],
      raw: true,
    });
    const r = rows[0] || {};
    return { debe: Number(r.total_debe || 0), haber: Number(r.total_haber || 0) };
  },

  /**
   * Movimientos de caja/bancos dentro del rango, agrupados por tipo de origen
   * del asiento (VENTA, COMPRA, PAGO, DEVOLUCION, MANUAL, CIERRE).
   *   entradas = Σdebe (ingresos de efectivo) · salidas = Σhaber (egresos).
   */
  async getMovimientosCajaPorOrigen({ fecha_inicio, fecha_fin }) {
    const rows = await LineaAsiento.findAll({
      attributes: [
        [sequelize.col('asiento.tipo_origen'), 'tipo_origen'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'entradas'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'salidas'],
      ],
      include: [
        {
          model: AsientoContable,
          as: 'asiento',
          where: { estado: 'CONFIRMADO', fecha: { [Op.between]: [fecha_inicio, fecha_fin] } },
          attributes: [],
        },
        { model: CuentaContable, as: 'cuenta', where: { codigo: { [Op.in]: ['1.1.1', '1.1.2'] } }, attributes: [] },
      ],
      group: ['asiento.tipo_origen'],
      raw: true,
    });
    return rows.map((r) => ({
      tipo_origen: r.tipo_origen,
      entradas: Number(r.entradas),
      salidas: Number(r.salidas),
    }));
  },
};
