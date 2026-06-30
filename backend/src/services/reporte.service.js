import { toCents, centsToAmount } from '../utils/money.js';
import { reporteRepository } from '../repositories/reporte.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';

/** Tipos de cuenta con naturaleza deudora (saldo = Debe − Haber). */
const NATURALEZA_DEUDORA = new Set(['ACTIVO', 'GASTO']);

/**
 * Saldo neto en centavos de una cuenta hoja según su naturaleza.
 *  - Deudora (ACTIVO, GASTO): Debe − Haber
 *  - Acreedora (PASIVO, PATRIMONIO, INGRESO): Haber − Debe
 */
function saldoNetoCents(tipo, totalDebe, totalHaber) {
  const debeCents = toCents(totalDebe);
  const haberCents = toCents(totalHaber);
  return NATURALEZA_DEUDORA.has(tipo) ? debeCents - haberCents : haberCents - debeCents;
}

/** Propaga los saldos desde las hojas hacia los padres (bottom-up). */
function propagarHaciaArriba(nodoMap, nivelesDesc) {
  for (const nivel of nivelesDesc) {
    for (const nodo of nodoMap.values()) {
      if (nodo.nivel !== nivel) continue;
      if (nodo.saldo_cents === 0) continue;
      if (nodo.id_cuenta_padre == null) continue;
      const padre = nodoMap.get(nodo.id_cuenta_padre);
      if (padre) padre.saldo_cents += nodo.saldo_cents;
    }
  }
}

/** Construye el mapa de nodos a partir del plan de cuentas (saldo_cents = 0). */
function construirMapaNodos(cuentas) {
  const nodoMap = new Map();
  const niveles = new Set();
  for (const c of cuentas) {
    nodoMap.set(c.id_cuenta, {
      id_cuenta: c.id_cuenta,
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      nivel: c.nivel,
      id_cuenta_padre: c.id_cuenta_padre,
      permite_movimiento: c.permite_movimiento,
      saldo_cents: 0,
    });
    niveles.add(c.nivel);
  }
  const nivelesDesc = [...niveles].sort((a, b) => b - a);
  return { nodoMap, nivelesDesc };
}

/** Inyecta los saldos de las hojas calculados desde los totales del período. */
function inyectarSaldosHojas(nodoMap, totalesPorCuenta) {
  for (const { id_cuenta, total_debe, total_haber } of totalesPorCuenta) {
    const nodo = nodoMap.get(id_cuenta);
    if (!nodo) continue;
    nodo.saldo_cents = saldoNetoCents(nodo.tipo, total_debe, total_haber);
  }
}

/** Deja solo nodos con saldo ≠ 0 o ancestros de ellos (mantiene jerarquía). */
function purgarArbol(nodoMap) {
  const activos = new Set();
  for (const nodo of nodoMap.values()) {
    if (nodo.saldo_cents !== 0) {
      let actual = nodo;
      while (actual) {
        if (activos.has(actual.id_cuenta)) break;
        activos.add(actual.id_cuenta);
        actual = actual.id_cuenta_padre != null ? nodoMap.get(actual.id_cuenta_padre) : null;
      }
    }
  }
  const nodosActivos = [];
  for (const nodo of nodoMap.values()) {
    if (activos.has(nodo.id_cuenta)) {
      nodosActivos.push({
        id_cuenta: nodo.id_cuenta,
        codigo: nodo.codigo,
        nombre: nodo.nombre,
        tipo: nodo.tipo,
        nivel: nodo.nivel,
        id_cuenta_padre: nodo.id_cuenta_padre,
        saldo: centsToAmount(nodo.saldo_cents),
      });
    }
  }
  return nodosActivos.sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/** Saldo en centavos de las cuentas raíz (nivel 1) de un tipo dado. */
function totalRaizCents(nodoMap, tipo) {
  let total = 0;
  for (const nodo of nodoMap.values()) {
    if (nodo.tipo === tipo && nodo.id_cuenta_padre == null) total += nodo.saldo_cents;
  }
  return total;
}

export function createReporteService({ reporteRepo = reporteRepository, cuentaRepo = cuentaRepository } = {}) {
  // Pipeline para reportes por PERÍODO (Estado de Resultados): usa el rango.
  async function pipelinePorPeriodo(filtros, tiposFiltro) {
    const [todasCuentas, totalesPorCuenta] = await Promise.all([
      cuentaRepo.findAll(),
      reporteRepo.getTotalesPorCuenta(filtros),
    ]);
    const cuentas = tiposFiltro ? todasCuentas.filter((c) => tiposFiltro.includes(c.tipo)) : todasCuentas;
    const { nodoMap, nivelesDesc } = construirMapaNodos(cuentas);
    inyectarSaldosHojas(nodoMap, totalesPorCuenta.filter((t) => nodoMap.has(t.id_cuenta)));
    propagarHaciaArriba(nodoMap, nivelesDesc);
    return { nodoMap };
  }

  return {
    /**
     * Balance General a una fecha de corte. Usa saldos ACUMULADOS hasta fecha_fin
     * (cuentas de stock) e incorpora el resultado del ejercicio al patrimonio,
     * de modo que Activo = Pasivo + Patrimonio se cumpla incluso antes del cierre.
     */
    async generarBalanceGeneral(filtros) {
      const [todasCuentas, totales] = await Promise.all([
        cuentaRepo.findAll(),
        reporteRepo.getTotalesAcumulados(filtros),
      ]);

      const cuentasBal = todasCuentas.filter((c) => ['ACTIVO', 'PASIVO', 'PATRIMONIO'].includes(c.tipo));
      const { nodoMap, nivelesDesc } = construirMapaNodos(cuentasBal);
      inyectarSaldosHojas(nodoMap, totales.filter((t) => nodoMap.has(t.id_cuenta)));
      propagarHaciaArriba(nodoMap, nivelesDesc);

      const totalActivoCents = totalRaizCents(nodoMap, 'ACTIVO');
      const totalPasivoCents = totalRaizCents(nodoMap, 'PASIVO');
      const totalPatrimonioCents = totalRaizCents(nodoMap, 'PATRIMONIO');

      // Resultado del ejercicio acumulado (Ingresos − Gastos) hasta fecha_fin.
      // Se suma al patrimonio para cumplir la ecuación aun sin cierre. Tras el
      // cierre (Etapa 7) ingresos/gastos quedan en cero → este término es 0 y no
      // se duplica el resultado (que ya vive en la cuenta de patrimonio 3.2.1).
      const porId = new Map(todasCuentas.map((c) => [c.id_cuenta, c]));
      let resultadoCents = 0;
      for (const t of totales) {
        const c = porId.get(t.id_cuenta);
        if (!c) continue;
        if (c.tipo === 'INGRESO') resultadoCents += toCents(t.total_haber) - toCents(t.total_debe);
        else if (c.tipo === 'GASTO') resultadoCents -= toCents(t.total_debe) - toCents(t.total_haber);
      }

      const patrimonioTotalCents = totalPatrimonioCents + resultadoCents;
      const cuentas = purgarArbol(nodoMap);

      return {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        cuentas,
        validacion: {
          total_activo: centsToAmount(totalActivoCents),
          total_pasivo: centsToAmount(totalPasivoCents),
          total_patrimonio: centsToAmount(totalPatrimonioCents),
          resultado_ejercicio: centsToAmount(resultadoCents),
          pasivo_mas_patrimonio: centsToAmount(totalPasivoCents + patrimonioTotalCents),
          ecuacion_cumplida: totalActivoCents === totalPasivoCents + patrimonioTotalCents,
        },
      };
    },

    /** Estado de Resultados del período: Utilidad = Ingresos − Gastos (por rango). */
    async generarEstadoResultados(filtros) {
      const { nodoMap } = await pipelinePorPeriodo(filtros, ['INGRESO', 'GASTO']);
      const totalIngresosCents = totalRaizCents(nodoMap, 'INGRESO');
      const totalGastosCents = totalRaizCents(nodoMap, 'GASTO');
      const utilidadCents = totalIngresosCents - totalGastosCents;
      const cuentas = purgarArbol(nodoMap);
      return {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        cuentas,
        resumen: {
          total_ingresos: centsToAmount(totalIngresosCents),
          total_gastos: centsToAmount(totalGastosCents),
          utilidad_neta: centsToAmount(utilidadCents),
          es_utilidad: utilidadCents >= 0,
        },
      };
    },
  };
}

export const reporteService = createReporteService();
