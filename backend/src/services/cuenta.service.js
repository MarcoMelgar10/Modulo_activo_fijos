import { ApiError } from '../utils/ApiError.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';

/**
 * Reglas de negocio del plan de cuentas:
 * - El código es único.
 * - El nivel se deriva de la cuenta padre.
 * - Una cuenta con subcuentas es de agrupación (no permite movimiento).
 * - Solo las cuentas hoja (permite_movimiento) reciben líneas de asiento.
 */
export function createCuentaService({ repo = cuentaRepository } = {}) {
  function construirArbol(cuentas) {
    const byId = new Map();
    const raices = [];
    cuentas.forEach((c) => byId.set(c.id_cuenta, { ...c.toJSON(), subcuentas: [] }));
    byId.forEach((nodo) => {
      if (nodo.id_cuenta_padre && byId.has(nodo.id_cuenta_padre)) {
        byId.get(nodo.id_cuenta_padre).subcuentas.push(nodo);
      } else {
        raices.push(nodo);
      }
    });
    return raices;
  }

  return {
    listar() {
      return repo.findAll();
    },

    async arbol() {
      const cuentas = await repo.findAll();
      return construirArbol(cuentas);
    },

    async obtener(id) {
      const cuenta = await repo.findById(id);
      if (!cuenta) throw ApiError.notFound('Cuenta contable no encontrada');
      return cuenta;
    },

    async crear({ codigo, nombre, tipo, id_cuenta_padre = null, permite_movimiento = true }) {
      if (await repo.findByCodigo(codigo)) {
        throw ApiError.conflict(`Ya existe una cuenta con el código ${codigo}`);
      }

      let nivel = 1;
      let tipoFinal = tipo;
      if (id_cuenta_padre) {
        const padre = await repo.findById(id_cuenta_padre);
        if (!padre) throw ApiError.badRequest('La cuenta padre no existe');
        nivel = padre.nivel + 1;
        // El tipo se hereda del padre para mantener coherencia contable.
        tipoFinal = padre.tipo;
        // El padre pasa a ser cuenta de agrupación.
        if (padre.permite_movimiento) {
          await padre.update({ permite_movimiento: false });
        }
      }
      if (!tipoFinal) throw ApiError.badRequest('El tipo de cuenta es obligatorio para cuentas raíz');

      return repo.create({
        codigo,
        nombre,
        tipo: tipoFinal,
        id_cuenta_padre,
        nivel,
        permite_movimiento,
      });
    },

    async actualizar(id, { nombre, permite_movimiento }) {
      const cuenta = await this.obtener(id);
      const updates = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (permite_movimiento !== undefined) {
        if (permite_movimiento === true && (await repo.countSubcuentas(id)) > 0) {
          throw ApiError.conflict('Una cuenta con subcuentas no puede permitir movimientos');
        }
        updates.permite_movimiento = permite_movimiento;
      }
      await cuenta.update(updates);
      return cuenta;
    },

    async eliminar(id) {
      const cuenta = await this.obtener(id);
      if ((await repo.countSubcuentas(id)) > 0) {
        throw ApiError.conflict('No se puede eliminar una cuenta que tiene subcuentas');
      }
      await cuenta.destroy();
    },
  };
}

export const cuentaService = createCuentaService();
