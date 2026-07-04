import { Sucursal, Empleado } from '../models/index.js';

export const sucursalRepository = {
  findAll() {
    return Sucursal.findAll({ order: [['id_sucursal', 'ASC']] });
  },

  findById(id) {
    return Sucursal.findByPk(id);
  },

  findByNombre(nombre) {
    return Sucursal.findOne({ where: { nombre } });
  },

  create(data) {
    return Sucursal.create(data);
  },

  async tieneOperacionesPendientes(id_sucursal) {
    const activos = await Empleado.count({ where: { id_sucursal, activo: true } });
    return activos > 0;
  },
};
