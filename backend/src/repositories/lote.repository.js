import { Op } from 'sequelize';
import { Lote, Producto, Proveedor, Sucursal } from '../models/index.js';

export const loteRepository = {
  findAll({ id_sucursal, id_producto, activo } = {}) {
    const where = {};
    if (id_sucursal) where.id_sucursal = id_sucursal;
    if (id_producto) where.id_producto = id_producto;
    if (activo !== undefined) where.activo = activo;
    return Lote.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'codigo_barras'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id_proveedor', 'razon_social'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
      ],
      order: [['fecha_vencimiento', 'ASC']],
    });
  },

  // Lotes con stock disponible de un producto en una sucursal, ordenados por
  // vencimiento ascendente (FEFO: First Expired, First Out).
  findDisponiblesFEFO({ id_producto, id_sucursal }, t) {
    return Lote.findAll({
      where: { id_producto, id_sucursal, activo: true, cantidad_actual: { [Op.gt]: 0 } },
      order: [['fecha_vencimiento', 'ASC'], ['id_lote', 'ASC']],
      transaction: t,
    });
  },

  findById(id, t) {
    return Lote.findByPk(id, { transaction: t });
  },

  // Descuenta stock de un lote (venta). Desactiva el lote si queda en cero.
  async descontar(id_lote, cantidad, t) {
    const lote = await Lote.findByPk(id_lote, { transaction: t });
    const nueva = lote.cantidad_actual - cantidad;
    await lote.update({ cantidad_actual: nueva, activo: nueva > 0 }, { transaction: t });
    return lote;
  },

  // Repone stock a un lote (devolución). Reactiva el lote.
  async reponer(id_lote, cantidad, t) {
    const lote = await Lote.findByPk(id_lote, { transaction: t });
    const nueva = lote.cantidad_actual + cantidad;
    await lote.update({ cantidad_actual: nueva, activo: true }, { transaction: t });
    return lote;
  },

  // Crea varios lotes dentro de una transacción (recepción de mercancía).
  bulkCreate(rows, t) {
    return Lote.bulkCreate(rows, { transaction: t });
  },
};
