import {
  CuentaPorPagar,
  PagoProveedor,
  Proveedor,
  OrdenCompra,
} from '../models/index.js';

const proveedorInclude = {
  model: Proveedor,
  as: 'proveedor',
  attributes: ['id_proveedor', 'razon_social', 'nit'],
};
const ordenInclude = { model: OrdenCompra, as: 'orden', attributes: ['id_orden', 'numero_orden'] };
const pagosInclude = { model: PagoProveedor, as: 'pagos' };

export const cuentaPorPagarRepository = {
  findAll({ estado, id_proveedor } = {}) {
    const where = {};
    if (estado) where.estado = estado;
    if (id_proveedor) where.id_proveedor = id_proveedor;
    return CuentaPorPagar.findAll({
      where,
      include: [proveedorInclude, ordenInclude],
      order: [['fecha_emision', 'DESC'], ['id_cxp', 'DESC']],
    });
  },

  findById(id) {
    return CuentaPorPagar.findByPk(id, {
      include: [proveedorInclude, ordenInclude, pagosInclude],
    });
  },

  create(data, t) {
    return CuentaPorPagar.create(data, t ? { transaction: t } : undefined);
  },

  createPago(data, t) {
    return PagoProveedor.create(data, t ? { transaction: t } : undefined);
  },
};
