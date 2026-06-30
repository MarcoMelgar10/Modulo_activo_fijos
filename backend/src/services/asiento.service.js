import { ApiError } from '../utils/ApiError.js';
import { toCents, sumCents, centsToAmount } from '../utils/money.js';
import { asientoRepository } from '../repositories/asiento.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { cierreRepository } from '../repositories/cierre.repository.js';

/**
 * Valida la partida doble de un conjunto de líneas (lógica pura, sin BD):
 * - Mínimo 2 líneas.
 * - Cada línea tiene debe XOR haber, con monto > 0.
 * - Σdebe == Σhaber y > 0.
 * Devuelve los totales en formato monetario.
 */
export function validarPartidaDoble(lineas) {
  if (!Array.isArray(lineas) || lineas.length < 2) {
    throw ApiError.badRequest('Un asiento requiere al menos dos líneas');
  }

  lineas.forEach((l, i) => {
    const debe = toCents(l.debe);
    const haber = toCents(l.haber);
    if (debe < 0 || haber < 0) {
      throw ApiError.badRequest(`Línea ${i + 1}: los montos no pueden ser negativos`);
    }
    if ((debe > 0 && haber > 0) || (debe === 0 && haber === 0)) {
      throw ApiError.badRequest(`Línea ${i + 1}: debe registrar monto en Debe o en Haber, no en ambos`);
    }
  });

  const totalDebe = sumCents(lineas, 'debe');
  const totalHaber = sumCents(lineas, 'haber');
  if (totalDebe === 0) {
    throw ApiError.badRequest('El asiento no puede tener importe cero');
  }
  if (totalDebe !== totalHaber) {
    throw ApiError.badRequest(
      `El asiento no está balanceado: Debe ${centsToAmount(totalDebe)} ≠ Haber ${centsToAmount(totalHaber)}`,
    );
  }
  return { totalDebe: centsToAmount(totalDebe), totalHaber: centsToAmount(totalHaber) };
}

export function createAsientoService({
  repo = asientoRepository,
  cuentas = cuentaRepository,
  cierres = cierreRepository,
} = {}) {
  async function validarCuentas(lineas) {
    const ids = [...new Set(lineas.map((l) => l.id_cuenta))];
    const encontradas = await cuentas.findByIds(ids);
    const porId = new Map(encontradas.map((c) => [c.id_cuenta, c]));

    for (const id of ids) {
      const cuenta = porId.get(id);
      if (!cuenta) throw ApiError.badRequest(`La cuenta ${id} no existe`);
      if (!cuenta.permite_movimiento) {
        throw ApiError.badRequest(
          `La cuenta ${cuenta.codigo} (${cuenta.nombre}) es de agrupación y no admite movimientos`,
        );
      }
    }
  }

  // Bloqueo de período (Etapa 7): no se permiten cambios de asientos cuya fecha
  // caiga en una gestión ya cerrada.
  async function assertPeriodoAbierto(fecha) {
    if (await cierres.periodoEstaCerrado(fecha)) {
      throw ApiError.conflict(
        'El período contable de esa fecha está cerrado; no se permiten cambios de asientos',
      );
    }
  }

  return {
    validarPartidaDoble,

    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const asiento = await repo.findById(id);
      if (!asiento) throw ApiError.notFound('Asiento no encontrado');
      return asiento;
    },

    async crear({ id_sucursal, fecha, concepto, tipo_origen = 'MANUAL', id_referencia = null, estado = 'BORRADOR', lineas }) {
      await assertPeriodoAbierto(fecha);
      validarPartidaDoble(lineas);
      await validarCuentas(lineas);

      const anio = new Date(fecha).getFullYear();

      const idCreado = await repo.transaction(async (t) => {
        const numero = await repo.siguienteNumero(anio, t);
        const asiento = await repo.crearAsiento(
          {
            id_sucursal,
            numero_asiento: numero,
            fecha,
            concepto,
            tipo_origen,
            id_referencia,
            estado,
          },
          t,
        );

        const rows = lineas.map((l) => ({
          id_asiento: asiento.id_asiento,
          id_cuenta: l.id_cuenta,
          descripcion: l.descripcion ?? null,
          debe: centsToAmount(toCents(l.debe)),
          haber: centsToAmount(toCents(l.haber)),
        }));
        await repo.crearLineas(rows, t);

        return asiento.id_asiento;
      });

      // Se consulta fuera de la transacción (ya confirmada) para devolver las relaciones.
      return repo.findById(idCreado);
    },

    async confirmar(id) {
      const asiento = await this.obtener(id);
      await assertPeriodoAbierto(asiento.fecha);
      if (asiento.estado !== 'BORRADOR') {
        throw ApiError.conflict(`Solo se confirman asientos en BORRADOR (actual: ${asiento.estado})`);
      }
      // Re-valida el cuadre antes de confirmar.
      validarPartidaDoble(asiento.lineas.map((l) => ({ debe: l.debe, haber: l.haber })));
      await asiento.update({ estado: 'CONFIRMADO' });
      return asiento;
    },

    async anular(id) {
      const asiento = await this.obtener(id);
      await assertPeriodoAbierto(asiento.fecha);
      if (asiento.estado !== 'CONFIRMADO') {
        throw ApiError.conflict(`Solo se anulan asientos CONFIRMADOS (actual: ${asiento.estado})`);
      }
      await asiento.update({ estado: 'ANULADO' });
      return asiento;
    },
  };
}

export const asientoService = createAsientoService();
