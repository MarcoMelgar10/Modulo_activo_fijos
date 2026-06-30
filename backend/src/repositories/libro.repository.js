import { Op } from 'sequelize';
import {
  sequelize,
  AsientoContable,
  LineaAsiento,
  CuentaContable,
  Sucursal,
} from '../models/index.js';

/**
 * Repositorio especializado para consultas de reportes contables
 * (Libro Diario y Libro Mayor). Aísla las queries complejas del servicio.
 */
export const libroRepository = {
  /**
   * Recupera las líneas de asientos confirmados en un rango de fechas,
   * con su cabecera y cuenta contable. Para el Libro Diario.
   */
  getLineasDiario({ fecha_inicio, fecha_fin, id_sucursal }) {
    const whereAsiento = {
      estado: 'CONFIRMADO',
      fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
    };
    if (id_sucursal) whereAsiento.id_sucursal = id_sucursal;

    return LineaAsiento.findAll({
      include: [
        {
          model: AsientoContable,
          as: 'asiento',
          where: whereAsiento,
          attributes: ['id_asiento', 'numero_asiento', 'fecha', 'concepto', 'tipo_origen'],
          include: [
            { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
          ],
        },
        {
          model: CuentaContable,
          as: 'cuenta',
          attributes: ['id_cuenta', 'codigo', 'nombre', 'tipo'],
        },
      ],
      order: [
        [{ model: AsientoContable, as: 'asiento' }, 'fecha', 'ASC'],
        [{ model: AsientoContable, as: 'asiento' }, 'numero_asiento', 'ASC'],
        ['id_linea', 'ASC'],
      ],
    });
  },

  /**
   * Recupera las líneas de una cuenta analítica (confirmadas) en un rango de fechas.
   * Para el Libro Mayor.
   */
  getLineasMayor({ id_cuenta, fecha_inicio, fecha_fin, id_sucursal }) {
    const whereAsiento = {
      estado: 'CONFIRMADO',
      fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
    };
    if (id_sucursal) whereAsiento.id_sucursal = id_sucursal;

    return LineaAsiento.findAll({
      where: { id_cuenta },
      include: [
        {
          model: AsientoContable,
          as: 'asiento',
          where: whereAsiento,
          attributes: ['id_asiento', 'numero_asiento', 'fecha', 'concepto', 'tipo_origen'],
          include: [
            { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
          ],
        },
        {
          model: CuentaContable,
          as: 'cuenta',
          attributes: ['id_cuenta', 'codigo', 'nombre', 'tipo'],
        },
      ],
      order: [
        [{ model: AsientoContable, as: 'asiento' }, 'fecha', 'ASC'],
        [{ model: AsientoContable, as: 'asiento' }, 'numero_asiento', 'ASC'],
        ['id_linea', 'ASC'],
      ],
    });
  },

  /**
   * Suma Debe y Haber de una cuenta antes de una fecha dada (para saldo inicial del Mayor).
   * Solo asientos CONFIRMADOS.
   */
  async getSaldoAnterior({ id_cuenta, fecha_inicio, id_sucursal }) {
    const whereAsiento = {
      estado: 'CONFIRMADO',
      fecha: { [Op.lt]: fecha_inicio },
    };
    if (id_sucursal) whereAsiento.id_sucursal = id_sucursal;

    const result = await LineaAsiento.findOne({
      where: { id_cuenta },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'total_debe'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'total_haber'],
      ],
      include: [
        {
          model: AsientoContable,
          as: 'asiento',
          where: whereAsiento,
          attributes: [],
        },
      ],
      raw: true,
    });

    return {
      total_debe: Number(result?.total_debe ?? 0),
      total_haber: Number(result?.total_haber ?? 0),
    };
  },
};
