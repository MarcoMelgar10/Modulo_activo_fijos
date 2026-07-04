import { Op } from 'sequelize';
import { Lote, Producto, Sucursal } from '../models/index.js';

export const inventarioRepository = {
  findLotes({ id_sucursal, id_producto, activo, solo_disponible, proximo_vencer_dias } = {}) {
    const where = {};
    if (id_sucursal) where.id_sucursal = id_sucursal;
    if (id_producto) where.id_producto = id_producto;
    if (activo !== undefined) where.activo = activo;
    if (solo_disponible) {
      where.cantidad_actual = { [Op.gt]: 0 };
      where.activo = true;
    }
    if (proximo_vencer_dias) {
      const limite = new Date();
      limite.setDate(limite.getDate() + proximo_vencer_dias);
      where.fecha_vencimiento = { [Op.lte]: limite.toISOString().slice(0, 10) };
    }
    return Lote.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'codigo_barras', 'stock_minimo'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
      ],
      order: [['fecha_vencimiento', 'ASC']],
    });
  },

  async getStockAgregado({ id_sucursal, id_producto } = {}) {
    const where = { activo: true, cantidad_actual: { [Op.gt]: 0 } };
    if (id_sucursal) where.id_sucursal = id_sucursal;
    if (id_producto) where.id_producto = id_producto;

    const lotes = await Lote.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'codigo_barras', 'stock_minimo'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
      ],
    });

    const agrupado = new Map();
    for (const l of lotes) {
      const key = `${l.id_producto}-${l.id_sucursal}`;
      if (!agrupado.has(key)) {
        agrupado.set(key, {
          id_producto: l.id_producto,
          producto: l.producto?.nombre ?? `#${l.id_producto}`,
          codigo_barras: l.producto?.codigo_barras ?? '',
          id_sucursal: l.id_sucursal,
          sucursal: l.sucursal?.nombre ?? `#${l.id_sucursal}`,
          cantidad_total: 0,
          stock_minimo: l.producto?.stock_minimo ?? 0,
        });
      }
      agrupado.get(key).cantidad_total += l.cantidad_actual;
    }

    return [...agrupado.values()].map((r) => ({
      ...r,
      estado_stock: r.cantidad_total < r.stock_minimo ? 'BAJO' : 'OK',
    }));
  },

  async getStockProducto(id_producto) {
    const lotes = await Lote.findAll({
      where: { id_producto, activo: true, cantidad_actual: { [Op.gt]: 0 } },
      include: [
        { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
      ],
      order: [['id_sucursal', 'ASC'], ['fecha_vencimiento', 'ASC']],
    });

    return lotes.map((l) => ({
      id_lote: l.id_lote,
      numero_lote: l.numero_lote,
      id_sucursal: l.id_sucursal,
      sucursal: l.sucursal?.nombre ?? `#${l.id_sucursal}`,
      cantidad_actual: l.cantidad_actual,
      fecha_vencimiento: l.fecha_vencimiento,
    }));
  },
};
