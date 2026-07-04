import { Op } from 'sequelize';
import { LogAuditoria, Empleado } from '../models/index.js';

const empleadoInclude = {
  model: Empleado,
  as: 'empleado',
  attributes: ['id_empleado', 'nombre', 'apellido', 'usuario'],
  required: false,
};

export const auditoriaRepository = {
  findAll({ desde, hasta, modulo, id_empleado, limite = 500 } = {}) {
    const where = {};
    if (modulo) where.modulo = modulo;
    if (id_empleado) where.id_empleado = id_empleado;
    if (desde || hasta) {
      where.fecha_hora = {};
      if (desde) where.fecha_hora[Op.gte] = `${desde} 00:00:00`;
      if (hasta) where.fecha_hora[Op.lte] = `${hasta} 23:59:59`;
    }
    return LogAuditoria.findAll({
      where,
      include: [empleadoInclude],
      order: [['fecha_hora', 'DESC'], ['id_log', 'DESC']],
      limit: limite,
    });
  },

  // Módulos distintos presentes en el log (para el filtro).
  async findModulos() {
    const rows = await LogAuditoria.findAll({
      attributes: ['modulo'],
      group: ['modulo'],
      order: [['modulo', 'ASC']],
      raw: true,
    });
    return rows.map((r) => r.modulo);
  },
};
