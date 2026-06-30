import { CierreContable, AsientoContable } from '../models/index.js';

/**
 * Acceso a datos de cierres de gestión. Aísla Sequelize del servicio (DIP).
 */
export const cierreRepository = {
  findByPeriodo({ anio, mes = 0 }) {
    return CierreContable.findOne({ where: { periodo_anio: anio, periodo_mes: mes } });
  },

  /**
   * Indica si la fecha cae en una gestión ya cerrada (bloqueo de período).
   * Para cierre anual basta con que exista un cierre CERRADO de ese año.
   */
  async periodoEstaCerrado(fecha) {
    if (!fecha) return false;
    const anio = Number(String(fecha).slice(0, 4));
    if (!Number.isInteger(anio)) return false;
    const cierre = await CierreContable.findOne({
      where: { periodo_anio: anio, estado: 'CERRADO' },
    });
    return Boolean(cierre);
  },

  crear(data) {
    return CierreContable.create(data);
  },

  findAll() {
    return CierreContable.findAll({
      order: [
        ['periodo_anio', 'DESC'],
        ['periodo_mes', 'DESC'],
      ],
      include: [{ model: AsientoContable, as: 'asientoCierre', attributes: ['id_asiento', 'numero_asiento'] }],
    });
  },

  findById(id) {
    return CierreContable.findByPk(id, {
      include: [{ model: AsientoContable, as: 'asientoCierre' }],
    });
  },
};
