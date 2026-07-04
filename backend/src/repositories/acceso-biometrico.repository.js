import { Op } from 'sequelize';
import { AccesoBiometrico, Empleado, Sucursal, DispositivoBiometrico } from '../models/index.js';

const includesBase = [
  { model: Empleado, as: 'empleado', attributes: ['id_empleado', 'nombre', 'apellido', 'usuario'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
  { model: DispositivoBiometrico, as: 'dispositivo', attributes: ['dispositivo_id', 'nombre'] },
];

export const accesoBiometricoRepository = {
  findAll(filtros = {}) {
    const where = {};
    if (filtros.id_sucursal) where.id_sucursal = filtros.id_sucursal;
    if (filtros.id_empleado) where.id_empleado = filtros.id_empleado;
    if (filtros.dispositivo_id) where.dispositivo_id = filtros.dispositivo_id;
    if (filtros.tipo_movimiento) where.tipo_movimiento = filtros.tipo_movimiento;
    if (filtros.resultado !== undefined) where.resultado = filtros.resultado;
    if (filtros.desde || filtros.hasta) {
      where.fecha_hora = {};
      if (filtros.desde) where.fecha_hora[Op.gte] = new Date(filtros.desde);
      if (filtros.hasta) {
        const hasta = new Date(filtros.hasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha_hora[Op.lte] = hasta;
      }
    }
    return AccesoBiometrico.findAll({
      where,
      include: includesBase,
      order: [['fecha_hora', 'DESC']],
      limit: 500,
    });
  },

  findById(id) {
    return AccesoBiometrico.findByPk(id, { include: includesBase });
  },

  create(data) {
    return AccesoBiometrico.create(data);
  },
};
