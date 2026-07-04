import { Traspaso, DetalleTraspaso, Sucursal, Empleado, Lote } from '../models/index.js';

const includesBase = [
  { model: Sucursal, as: 'sucursalOrigen', attributes: ['id_sucursal', 'nombre'] },
  { model: Sucursal, as: 'sucursalDestino', attributes: ['id_sucursal', 'nombre'] },
  { model: Empleado, as: 'empleado', attributes: ['id_empleado', 'nombre', 'apellido'] },
  { model: Empleado, as: 'empleadoRecibe', attributes: ['id_empleado', 'nombre', 'apellido'] },
];

const detalleIncludes = [
  { model: Lote, as: 'loteOrigen', attributes: ['id_lote', 'numero_lote', 'id_producto'] },
  { model: Lote, as: 'loteDestino', attributes: ['id_lote', 'numero_lote'] },
];

export const traspasoRepository = {
  findAll(filtros = {}) {
    const where = {};
    if (filtros.estado) where.estado = filtros.estado;
    return Traspaso.findAll({
      where,
      include: [...includesBase, { model: DetalleTraspaso, as: 'detalles', include: detalleIncludes }],
      order: [['id_traspaso', 'DESC']],
    });
  },

  findById(id) {
    return Traspaso.findByPk(id, {
      include: [...includesBase, { model: DetalleTraspaso, as: 'detalles', include: detalleIncludes }],
    });
  },

  crear(data, detalles, t) {
    return Traspaso.create(data, { transaction: t }).then(async (traspaso) => {
      const rows = detalles.map((d) => ({ ...d, id_traspaso: traspaso.id_traspaso }));
      await DetalleTraspaso.bulkCreate(rows, { transaction: t });
      return traspaso;
    });
  },

  actualizarEstado(id, cambios, t) {
    return Traspaso.update(cambios, { where: { id_traspaso: id }, transaction: t });
  },

  actualizarDetalle(id_detalle, cambios, t) {
    return DetalleTraspaso.update(cambios, { where: { id_detalle }, transaction: t });
  },

  findDetallesByTraspaso(id_traspaso, t) {
    return DetalleTraspaso.findAll({
      where: { id_traspaso },
      include: detalleIncludes,
      transaction: t,
    });
  },

  transaction(fn) {
    return Traspaso.sequelize.transaction(fn);
  },
};
