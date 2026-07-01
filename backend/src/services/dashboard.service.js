import { toCents, centsToAmount } from '../utils/money.js';
import { reporteRepository as defaultReporteRepo } from '../repositories/reporte.repository.js';
import { cierreRepository as defaultCierreRepo } from '../repositories/cierre.repository.js';
import { reporteService as defaultReporteService } from './reporte.service.js';

/** Último día del mes (YYYY-MM-DD). */
function finDelMes(anio, mes) {
  return new Date(anio, mes, 0).toISOString().slice(0, 10);
}

export function createDashboardService({
  reporteRepo = defaultReporteRepo,
  cierreRepo = defaultCierreRepo,
  reporteService = defaultReporteService,
} = {}) {
  return {
    async obtenerKPIs({ gestion, mes }) {
      const fechaInicio = `${gestion}-01-01`;
      const fechaFin = `${gestion}-12-31`;

      // 1. Utilidad del ejercicio (reutiliza reporteService)
      const estadoResultados = await reporteService.generarEstadoResultados({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      // 2. IVA del mes
      const mesStr = String(mes).padStart(2, '0');
      const ivaData = await reporteRepo.getIVAPorPeriodo({
        fecha_inicio: `${gestion}-${mesStr}-01`,
        fecha_fin: finDelMes(gestion, mes),
      });

      // 3. Estado del cierre
      const cierre = await cierreRepo.findByPeriodo({ anio: gestion });

      return {
        gestion,
        mes,
        utilidad_ejercicio: estadoResultados.resumen.utilidad_neta,
        iva_debito: centsToAmount(toCents(ivaData.debito)),
        iva_credito: centsToAmount(toCents(ivaData.credito)),
        iva_neto: centsToAmount(toCents(ivaData.debito) - toCents(ivaData.credito)),
        cierre_estado: cierre ? 'CERRADO' : 'ABIERTO',
      };
    },
  };
}

export const dashboardService = createDashboardService();
