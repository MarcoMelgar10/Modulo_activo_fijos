import { Op } from 'sequelize';
import { CuentaContable } from '../models/index.js';

export const cuentaRepository = {
  findAll() {
    return CuentaContable.findAll({ order: [['codigo', 'ASC']] });
  },

  findById(id) {
    return CuentaContable.findByPk(id);
  },

  findByCodigo(codigo) {
    return CuentaContable.findOne({ where: { codigo } });
  },

  findByIds(ids) {
    return CuentaContable.findAll({ where: { id_cuenta: ids } });
  },

  findByCodigos(codigos) {
    return CuentaContable.findAll({ where: { codigo: { [Op.in]: codigos } } });
  },

  countSubcuentas(idPadre) {
    return CuentaContable.count({ where: { id_cuenta_padre: idPadre } });
  },

  create(data) {
    return CuentaContable.create(data);
  },
};
