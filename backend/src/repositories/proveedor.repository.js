import { Proveedor } from '../models/index.js';

export const proveedorRepository = {
  findAll({ activo } = {}) {
    const where = {};
    if (activo !== undefined) where.activo = activo;
    return Proveedor.findAll({ where, order: [['razon_social', 'ASC']] });
  },

  findById(id) {
    return Proveedor.findByPk(id);
  },

  findByNit(nit) {
    return Proveedor.findOne({ where: { nit } });
  },

  create(data) {
    return Proveedor.create(data);
  },
};
