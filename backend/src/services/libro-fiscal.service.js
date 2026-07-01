import { toCents, centsToAmount } from '../utils/money.js';
import { libroFiscalRepository as defaultRepo } from '../repositories/libro-fiscal.repository.js';

/** Último día del mes (YYYY-MM-DD). */
function finDelMes(anio, mes) {
  return new Date(anio, mes, 0).toISOString().slice(0, 10);
}

export function createLibroFiscalService({ repo = defaultRepo } = {}) {
  async function obtenerLibro(tipo, { mes, gestion }) {
    const mesStr = String(mes).padStart(2, '0');
    const registros = await repo.getRegistros({
      tipo_origen: tipo,
      fecha_inicio: `${gestion}-${mesStr}-01`,
      fecha_fin: finDelMes(gestion, mes),
    });

    // Totales en centavos para evitar coma flotante
    let totalNeto = 0;
    let totalIVA = 0;
    let totalGeneral = 0;
    for (const r of registros) {
      totalNeto += toCents(r.monto_neto);
      totalIVA += toCents(r.iva);
      totalGeneral += toCents(r.monto_total);
    }

    return {
      periodo: { mes: Number(mes), gestion: Number(gestion) },
      registros,
      totales: {
        total_neto: centsToAmount(totalNeto),
        total_iva: centsToAmount(totalIVA),
        total_general: centsToAmount(totalGeneral),
      },
    };
  }

  return {
    obtenerLibroCompras(filtros) {
      return obtenerLibro('COMPRA', filtros);
    },
    obtenerLibroVentas(filtros) {
      return obtenerLibro('VENTA', filtros);
    },
  };
}

export const libroFiscalService = createLibroFiscalService();
