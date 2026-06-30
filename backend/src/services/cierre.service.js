import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { cierreRepository } from '../repositories/cierre.repository.js';
import { reporteRepository } from '../repositories/reporte.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { asientoService as defaultAsientoService } from './asiento.service.js';

/** Cuenta de patrimonio donde se acumula el resultado de la gestión. */
const CODIGO_RESULTADO = '3.2.1';

/**
 * Servicio de Cierre de Gestión (RF-CON-05) — modalidad ANUAL.
 *
 * Cerrar una gestión:
 *  1. Calcula el saldo de cada cuenta de resultado (INGRESO / GASTO) del año.
 *  2. Genera un asiento de cierre CONFIRMADO que cancela esos saldos y traslada
 *     el resultado neto a la cuenta de patrimonio "Resultado del Ejercicio".
 *  3. Registra el período como CERRADO (a partir de ahí queda bloqueado).
 *
 * Dependencias inyectadas (DIP) para testear sin base de datos.
 */
export function createCierreService({
  repo = cierreRepository,
  reporteRepo = reporteRepository,
  cuentaRepo = cuentaRepository,
  asientoService = defaultAsientoService,
} = {}) {
  return {
    listar() {
      return repo.findAll();
    },

    async obtener(id) {
      const cierre = await repo.findById(id);
      if (!cierre) throw ApiError.notFound('Cierre no encontrado');
      return cierre;
    },

    /**
     * Cierra una gestión anual completa.
     * @param {{ anio:number, idEmpleado?:number, idSucursal?:number }} params
     * @returns {Promise<{ cierre:object, asiento:object }>}
     */
    async cerrarPeriodo({ anio, idEmpleado = null, idSucursal = 1 }) {
      // 1. No permitir cerrar dos veces la misma gestión.
      if (await repo.findByPeriodo({ anio, mes: 0 })) {
        throw ApiError.conflict(`La gestión ${anio} ya está cerrada`);
      }

      const fechaInicio = `${anio}-01-01`;
      const fechaFin = `${anio}-12-31`;

      // 2. Saldos por cuenta del año (solo asientos confirmados).
      const totales = await reporteRepo.getTotalesPorCuenta({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      const cuentas = await cuentaRepo.findAll();
      const porId = new Map(cuentas.map((c) => [c.id_cuenta, c]));

      // 3. Líneas de cierre: cancelar ingresos (al Debe) y gastos (al Haber).
      const lineas = [];
      let ingresosCents = 0;
      let gastosCents = 0;

      for (const t of totales) {
        const cuenta = porId.get(t.id_cuenta);
        if (!cuenta) continue;
        const debeC = toCents(t.total_debe);
        const haberC = toCents(t.total_haber);

        if (cuenta.tipo === 'INGRESO') {
          const saldo = haberC - debeC; // naturaleza acreedora
          if (saldo > 0) {
            lineas.push({
              id_cuenta: cuenta.id_cuenta,
              descripcion: `Cierre ${cuenta.codigo} ${cuenta.nombre}`,
              debe: centsToAmount(saldo),
              haber: 0,
            });
            ingresosCents += saldo;
          }
        } else if (cuenta.tipo === 'GASTO') {
          const saldo = debeC - haberC; // naturaleza deudora
          if (saldo > 0) {
            lineas.push({
              id_cuenta: cuenta.id_cuenta,
              descripcion: `Cierre ${cuenta.codigo} ${cuenta.nombre}`,
              debe: 0,
              haber: centsToAmount(saldo),
            });
            gastosCents += saldo;
          }
        }
      }

      if (ingresosCents === 0 && gastosCents === 0) {
        throw ApiError.badRequest(
          `No hay ingresos ni gastos confirmados para cerrar en la gestión ${anio}`,
        );
      }

      // 4. Contrapartida: resultado del ejercicio (patrimonio).
      const cuentaResultado = await cuentaRepo.findByCodigo(CODIGO_RESULTADO);
      if (!cuentaResultado) {
        throw ApiError.badRequest(
          `No existe la cuenta ${CODIGO_RESULTADO} (Resultado del Ejercicio) en el plan de cuentas`,
        );
      }

      const resultadoCents = ingresosCents - gastosCents;
      if (resultadoCents > 0) {
        lineas.push({
          id_cuenta: cuentaResultado.id_cuenta,
          descripcion: 'Utilidad del ejercicio',
          debe: 0,
          haber: centsToAmount(resultadoCents),
        });
      } else if (resultadoCents < 0) {
        lineas.push({
          id_cuenta: cuentaResultado.id_cuenta,
          descripcion: 'Pérdida del ejercicio',
          debe: centsToAmount(-resultadoCents),
          haber: 0,
        });
      }

      // 5. Asiento de cierre (CONFIRMADO). asientoService valida la partida doble.
      //    Se crea antes de registrar el cierre, de modo que el bloqueo de período
      //    todavía no aplica a este asiento.
      const asiento = await asientoService.crear({
        id_sucursal: idSucursal,
        fecha: fechaFin,
        concepto: `Asiento de cierre de la gestión ${anio}`,
        tipo_origen: 'CIERRE',
        estado: 'CONFIRMADO',
        lineas,
      });

      // 6. Registrar el cierre (bloquea la gestión a partir de aquí).
      const cierre = await repo.crear({
        periodo_anio: anio,
        periodo_mes: 0,
        id_sucursal: idSucursal ?? null,
        estado: 'CERRADO',
        fecha_cierre: fechaFin,
        total_ingresos: centsToAmount(ingresosCents),
        total_gastos: centsToAmount(gastosCents),
        resultado: centsToAmount(resultadoCents),
        id_asiento_cierre: asiento.id_asiento,
        id_empleado: idEmpleado,
      });

      return { cierre, asiento };
    },
  };
}

export const cierreService = createCierreService();
