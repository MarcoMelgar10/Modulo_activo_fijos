import { Op } from 'sequelize';
import {
  sequelize,
  Venta,
  DetalleVenta,
  Producto,
  Lote,
  Sucursal,
  Empleado,
} from '../models/index.js';

const detalleInclude = {
  model: DetalleVenta,
  as: 'detalles',
  include: [
    { model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'codigo_barras'] },
    { model: Lote, as: 'lote', attributes: ['id_lote', 'numero_lote'] },
  ],
};
const sucursalInclude = { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] };
const cajeroInclude = { model: Empleado, as: 'cajero', attributes: ['id_empleado', 'nombre', 'apellido'] };

export const ventaRepository = {
  transaction(fn) {
    return sequelize.transaction(fn);
  },

  async siguienteNumero(anio, t) {
    const count = await Venta.count({
      where: { numero_venta: { [Op.like]: `VTA-${anio}-%` } },
      transaction: t,
    });
    return `VTA-${anio}-${String(count + 1).padStart(5, '0')}`;
  },

  crearVenta(data, t) {
    return Venta.create(data, { transaction: t });
  },

  crearDetalles(rows, t) {
    return DetalleVenta.bulkCreate(rows, { transaction: t });
  },

  findById(id) {
    return Venta.findByPk(id, { include: [detalleInclude, sucursalInclude, cajeroInclude] });
  },

  findDetalleById(id) {
    return DetalleVenta.findByPk(id);
  },

  buildWhere({ desde, hasta, id_sucursal, id_cajero, estado, metodo_pago } = {}) {
    const where = {};
    if (id_sucursal) where.id_sucursal = id_sucursal;
    if (id_cajero) where.id_cajero = id_cajero;
    if (estado) where.estado = estado;
    if (metodo_pago) where.metodo_pago = metodo_pago;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }
    return where;
  },

  findAll(filtros = {}) {
    const where = this.buildWhere(filtros);
    // Filtro opcional por producto: exige que la venta contenga ese producto.
    const detalle = filtros.id_producto
      ? { ...detalleInclude, required: true, where: { id_producto: filtros.id_producto } }
      : detalleInclude;
    return Venta.findAll({
      where,
      include: [detalle, sucursalInclude, cajeroInclude],
      order: [['fecha', 'DESC'], ['id_venta', 'DESC']],
    });
  },
};
