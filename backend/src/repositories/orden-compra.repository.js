import { Op } from 'sequelize';
import {
  sequelize,
  OrdenCompra,
  DetalleOrdenCompra,
  Proveedor,
  Producto,
  Sucursal,
} from '../models/index.js';

const detalleInclude = {
  model: DetalleOrdenCompra,
  as: 'detalles',
  include: [{ model: Producto, as: 'producto', attributes: ['id_producto', 'nombre', 'codigo_barras'] }],
};
const proveedorInclude = {
  model: Proveedor,
  as: 'proveedor',
  attributes: ['id_proveedor', 'razon_social', 'nit'],
};
const sucursalInclude = { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] };

export const ordenCompraRepository = {
  transaction(fn) {
    return sequelize.transaction(fn);
  },

  async siguienteNumero(anio, t) {
    const count = await OrdenCompra.count({
      where: { numero_orden: { [Op.like]: `OC-${anio}-%` } },
      transaction: t,
    });
    return `OC-${anio}-${String(count + 1).padStart(5, '0')}`;
  },

  crearOrden(data, t) {
    return OrdenCompra.create(data, { transaction: t });
  },

  crearDetalles(rows, t) {
    return DetalleOrdenCompra.bulkCreate(rows, { transaction: t });
  },

  findById(id) {
    return OrdenCompra.findByPk(id, {
      include: [detalleInclude, proveedorInclude, sucursalInclude],
    });
  },

  findAll({ estado, id_proveedor } = {}) {
    const where = {};
    if (estado) where.estado = estado;
    if (id_proveedor) where.id_proveedor = id_proveedor;
    return OrdenCompra.findAll({
      where,
      include: [detalleInclude, proveedorInclude],
      order: [
        ['fecha_emision', 'DESC'],
        ['id_orden', 'DESC'],
      ],
    });
  },
};
