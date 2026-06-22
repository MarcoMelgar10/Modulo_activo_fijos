import { Op } from 'sequelize';
import {
  sequelize,
  AsientoContable,
  LineaAsiento,
  CuentaContable,
  Sucursal,
} from '../models/index.js';

const lineasInclude = {
  model: LineaAsiento,
  as: 'lineas',
  include: [{ model: CuentaContable, as: 'cuenta', attributes: ['id_cuenta', 'codigo', 'nombre', 'tipo'] }],
};

export const asientoRepository = {
  transaction(fn) {
    return sequelize.transaction(fn);
  },

  async siguienteNumero(anio, t) {
    const count = await AsientoContable.count({
      where: { numero_asiento: { [Op.like]: `AST-${anio}-%` } },
      transaction: t,
    });
    return `AST-${anio}-${String(count + 1).padStart(5, '0')}`;
  },

  crearAsiento(data, t) {
    return AsientoContable.create(data, { transaction: t });
  },

  crearLineas(rows, t) {
    return LineaAsiento.bulkCreate(rows, { transaction: t });
  },

  findById(id) {
    return AsientoContable.findByPk(id, {
      include: [lineasInclude, { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] }],
    });
  },

  findAll({ desde, hasta, estado, tipo_origen } = {}) {
    const where = {};
    if (estado) where.estado = estado;
    if (tipo_origen) where.tipo_origen = tipo_origen;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }
    return AsientoContable.findAll({
      where,
      include: [lineasInclude],
      order: [
        ['fecha', 'DESC'],
        ['id_asiento', 'DESC'],
      ],
    });
  },
};
