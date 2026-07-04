import {
  sequelize,
  Presupuesto,
  LineaPresupuesto,
  CuentaContable,
  Empleado,
} from '../models/index.js';

const lineasInclude = {
  model: LineaPresupuesto,
  as: 'lineas',
  include: [{ model: CuentaContable, as: 'cuenta', attributes: ['id_cuenta', 'codigo', 'nombre', 'tipo'] }],
};
const creadorInclude = { model: Empleado, as: 'creador', attributes: ['id_empleado', 'nombre', 'apellido'] };
const aprobadorInclude = { model: Empleado, as: 'aprobador', attributes: ['id_empleado', 'nombre', 'apellido'] };

export const presupuestoRepository = {
  transaction(fn) {
    return sequelize.transaction(fn);
  },

  crearPresupuesto(data, t) {
    return Presupuesto.create(data, { transaction: t });
  },

  crearLineas(rows, t) {
    return LineaPresupuesto.bulkCreate(rows, { transaction: t });
  },

  borrarLineas(id_presupuesto, t) {
    return LineaPresupuesto.destroy({ where: { id_presupuesto }, transaction: t });
  },

  findById(id) {
    return Presupuesto.findByPk(id, { include: [lineasInclude, creadorInclude, aprobadorInclude] });
  },

  findAll({ gestion, estado } = {}) {
    const where = {};
    if (gestion) where.gestion = gestion;
    if (estado) where.estado = estado;
    return Presupuesto.findAll({
      where,
      include: [lineasInclude, creadorInclude, aprobadorInclude],
      order: [['gestion', 'DESC'], ['id_presupuesto', 'DESC']],
    });
  },

  // Presupuesto ya APROBADO para una gestión (para impedir aprobar dos).
  findAprobadoPorGestion(gestion) {
    return Presupuesto.findOne({ where: { gestion, estado: 'APROBADO' } });
  },
};
