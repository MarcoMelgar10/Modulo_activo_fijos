import { ApiError } from '../utils/ApiError.js';
import { toCents, centsToAmount } from '../utils/money.js';
import { presupuestoRepository } from '../repositories/presupuesto.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { reporteRepository } from '../repositories/reporte.repository.js';

const TIPOS_PRESUPUESTABLES = ['INGRESO', 'GASTO'];

/**
 * Presupuesto anual (RF-PRE-01..05).
 * - Definición (RF-PRE-01): el CONTADOR crea líneas por cuenta de INGRESO/GASTO.
 * - Aprobación (RF-PRE-02): el GERENTE aprueba o rechaza (solo desde BORRADOR).
 * - Ejecución (RF-PRE-03/04/05): compara lo planificado con lo real (movimientos
 *   contables de la gestión), calcula % de ejecución y alerta sobregiros / bajo meta.
 */
export function createPresupuestoService({
  repo = presupuestoRepository,
  cuentaRepo = cuentaRepository,
  reporteRepo = reporteRepository,
} = {}) {
  async function validarLineas(lineas) {
    if (!Array.isArray(lineas) || lineas.length === 0) {
      throw ApiError.badRequest('El presupuesto requiere al menos una línea');
    }
    const ids = [...new Set(lineas.map((l) => l.id_cuenta))];
    if (ids.length !== lineas.length) {
      throw ApiError.badRequest('No se puede repetir la misma cuenta en dos líneas');
    }
    const cuentas = await cuentaRepo.findByIds(ids);
    const porId = new Map(cuentas.map((c) => [c.id_cuenta, c]));
    for (const l of lineas) {
      const cuenta = porId.get(l.id_cuenta);
      if (!cuenta) throw ApiError.badRequest(`La cuenta ${l.id_cuenta} no existe`);
      if (!cuenta.permite_movimiento) {
        throw ApiError.badRequest(`La cuenta ${cuenta.codigo} es de agrupación y no admite presupuesto`);
      }
      if (!TIPOS_PRESUPUESTABLES.includes(cuenta.tipo)) {
        throw ApiError.badRequest(`Solo se presupuestan cuentas de Ingreso o Gasto (${cuenta.codigo} es ${cuenta.tipo})`);
      }
      if (Number(l.monto_planificado) < 0) throw ApiError.badRequest('El monto planificado no puede ser negativo');
    }
  }

  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const p = await repo.findById(id);
      if (!p) throw ApiError.notFound('Presupuesto no encontrado');
      return p;
    },

    async crear({ nombre, gestion, lineas }, creadorId = null) {
      await validarLineas(lineas);
      const idCreado = await repo.transaction(async (t) => {
        const p = await repo.crearPresupuesto(
          { nombre, gestion, estado: 'BORRADOR', id_empleado_creador: creadorId },
          t,
        );
        await repo.crearLineas(
          lineas.map((l) => ({
            id_presupuesto: p.id_presupuesto,
            id_cuenta: l.id_cuenta,
            monto_planificado: centsToAmount(toCents(l.monto_planificado)),
          })),
          t,
        );
        return p.id_presupuesto;
      });
      return repo.findById(idCreado);
    },

    async actualizar(id, { nombre, lineas }) {
      const p = await this.obtener(id);
      if (p.estado !== 'BORRADOR') {
        throw ApiError.conflict(`Solo se edita un presupuesto en BORRADOR (actual: ${p.estado})`);
      }
      if (lineas) await validarLineas(lineas);

      await repo.transaction(async (t) => {
        if (nombre !== undefined) await p.update({ nombre }, { transaction: t });
        if (lineas) {
          await repo.borrarLineas(id, t);
          await repo.crearLineas(
            lineas.map((l) => ({
              id_presupuesto: id,
              id_cuenta: l.id_cuenta,
              monto_planificado: centsToAmount(toCents(l.monto_planificado)),
            })),
            t,
          );
        }
      });
      return repo.findById(id);
    },

    async aprobar(id, aprobadorId = null) {
      const p = await this.obtener(id);
      if (p.estado !== 'BORRADOR') {
        throw ApiError.conflict(`Solo se aprueba un presupuesto en BORRADOR (actual: ${p.estado})`);
      }
      const yaAprobado = await repo.findAprobadoPorGestion(p.gestion);
      if (yaAprobado) {
        throw ApiError.conflict(`Ya existe un presupuesto aprobado para la gestión ${p.gestion}`);
      }
      await p.update({
        estado: 'APROBADO',
        id_empleado_aprobador: aprobadorId,
        fecha_aprobacion: new Date().toISOString().slice(0, 10),
      });
      return repo.findById(id);
    },

    async rechazar(id, { observacion } = {}, aprobadorId = null) {
      const p = await this.obtener(id);
      if (p.estado !== 'BORRADOR') {
        throw ApiError.conflict(`Solo se rechaza un presupuesto en BORRADOR (actual: ${p.estado})`);
      }
      await p.update({ estado: 'RECHAZADO', id_empleado_aprobador: aprobadorId, observacion: observacion ?? null });
      return repo.findById(id);
    },

    /**
     * Ejecución presupuestaria (RF-PRE-03/04/05): compara el monto planificado de
     * cada línea con el ejecutado real (movimientos contables de la gestión).
     */
    async ejecucion(id) {
      const p = await this.obtener(id);
      const fecha_inicio = `${p.gestion}-01-01`;
      const fecha_fin = `${p.gestion}-12-31`;
      const totales = await reporteRepo.getTotalesPorCuenta({ fecha_inicio, fecha_fin });
      const porCuenta = new Map(totales.map((t) => [t.id_cuenta, t]));

      let planIngCents = 0;
      let realIngCents = 0;
      let planGastoCents = 0;
      let realGastoCents = 0;

      const lineas = p.lineas.map((l) => {
        const tipo = l.cuenta.tipo;
        const t = porCuenta.get(l.id_cuenta) || { total_debe: 0, total_haber: 0 };
        // INGRESO: acreedora (haber − debe) · GASTO: deudora (debe − haber).
        const realCents = tipo === 'INGRESO'
          ? toCents(t.total_haber) - toCents(t.total_debe)
          : toCents(t.total_debe) - toCents(t.total_haber);
        const planCents = toCents(l.monto_planificado);

        if (tipo === 'INGRESO') { planIngCents += planCents; realIngCents += realCents; }
        else { planGastoCents += planCents; realGastoCents += realCents; }

        const porcentaje = planCents > 0 ? Math.round((realCents / planCents) * 1000) / 10 : null;
        // Alerta: gasto sobregirado (real > plan) o ingreso bajo meta (real < plan).
        let alerta = null;
        if (tipo === 'GASTO' && realCents > planCents) alerta = 'SOBREGIRO';
        if (tipo === 'INGRESO' && realCents < planCents) alerta = 'BAJO_META';

        return {
          id_cuenta: l.id_cuenta,
          codigo: l.cuenta.codigo,
          nombre: l.cuenta.nombre,
          tipo,
          planificado: centsToAmount(planCents),
          real: centsToAmount(realCents),
          desviacion: centsToAmount(planCents - realCents),
          porcentaje,
          alerta,
        };
      });

      return {
        id_presupuesto: p.id_presupuesto,
        nombre: p.nombre,
        gestion: p.gestion,
        estado: p.estado,
        lineas,
        totales: {
          plan_ingresos: centsToAmount(planIngCents),
          real_ingresos: centsToAmount(realIngCents),
          plan_gastos: centsToAmount(planGastoCents),
          real_gastos: centsToAmount(realGastoCents),
          plan_utilidad: centsToAmount(planIngCents - planGastoCents),
          real_utilidad: centsToAmount(realIngCents - realGastoCents),
        },
      };
    },
  };
}

export const presupuestoService = createPresupuestoService();
