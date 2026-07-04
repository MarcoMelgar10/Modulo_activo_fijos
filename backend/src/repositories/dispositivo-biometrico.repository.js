import { DispositivoBiometrico, Sucursal } from '../models/index.js';

export const dispositivoBiometricoRepository = {
  findAll(id_sucursal) {
    const where = {};
    if (id_sucursal) where.id_sucursal = id_sucursal;
    return DispositivoBiometrico.findAll({
      where,
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] }],
      order: [['dispositivo_id', 'ASC']],
    });
  },

  findById(id) {
    return DispositivoBiometrico.findByPk(id, {
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] }],
    });
  },

  create(data) {
    return DispositivoBiometrico.create(data);
  },

  async actualizar(id, changes) {
    const d = await DispositivoBiometrico.findByPk(id);
    if (!d) return null;
    await d.update(changes);
    return this.findById(id);
  },
};
