import { Devolucion, DetalleDevolucion, DetalleVenta } from '../models/index.js';

const detalleInclude = {
  model: DetalleDevolucion,
  as: 'detalles',
  include: [{ model: DetalleVenta, as: 'detalleVenta' }],
};

export const devolucionRepository = {
  crearDevolucion(data, t) {
    return Devolucion.create(data, { transaction: t });
  },

  crearDetalles(rows, t) {
    return DetalleDevolucion.bulkCreate(rows, { transaction: t });
  },

  findById(id) {
    return Devolucion.findByPk(id, { include: [detalleInclude] });
  },

  findByVenta(id_venta) {
    return Devolucion.findAll({ where: { id_venta }, include: [detalleInclude] });
  },
};
