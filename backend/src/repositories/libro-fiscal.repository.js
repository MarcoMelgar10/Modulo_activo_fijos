import { Op } from 'sequelize';
import { AsientoContable, LineaAsiento, CuentaContable } from '../models/index.js';

/** Códigos de cuenta de IVA según tipo de origen. */
const IVA_CODIGOS = {
  COMPRA: '1.1.5',   // IVA Crédito Fiscal → debe
  VENTA: '2.1.2',    // IVA Débito Fiscal → haber
};

export const libroFiscalRepository = {
  /**
   * Registros fiscales: una fila por asiento del tipo dado en el período.
   * Cada registro incluye el monto IVA extraído de la línea de IVA del asiento.
   */
  async getRegistros({ tipo_origen, fecha_inicio, fecha_fin }) {
    const codigoIVA = IVA_CODIGOS[tipo_origen];

    // 1. Buscar asientos confirmados del tipo y período
    const asientos = await AsientoContable.findAll({
      where: {
        estado: 'CONFIRMADO',
        tipo_origen,
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
      },
      include: [
        {
          model: LineaAsiento,
          as: 'lineas',
          include: [{ model: CuentaContable, as: 'cuenta', attributes: ['codigo'] }],
        },
      ],
      order: [['fecha', 'ASC'], ['numero_asiento', 'ASC']],
    });

    // 2. Extraer montos por asiento
    return asientos.map((a) => {
      let iva = 0;
      let totalDebe = 0;
      for (const l of a.lineas) {
        totalDebe += Number(l.debe);
        if (l.cuenta?.codigo === codigoIVA) {
          iva = tipo_origen === 'COMPRA' ? Number(l.debe) : Number(l.haber);
        }
      }
      const montoTotal = totalDebe; // Σdebe = total del asiento
      const montoNeto = montoTotal - iva;

      return {
        fecha: a.fecha,
        numero_asiento: a.numero_asiento,
        concepto: a.concepto,
        monto_neto: Number(montoNeto.toFixed(2)),
        iva: Number(iva.toFixed(2)),
        monto_total: Number(montoTotal.toFixed(2)),
      };
    });
  },
};
