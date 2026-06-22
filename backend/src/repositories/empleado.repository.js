import { Empleado, Rol, Sucursal } from '../models/index.js';

/**
 * Capa de acceso a datos para empleados. Aísla Sequelize del resto de la app
 * (DIP): los servicios dependen de esta interfaz, no del ORM directamente.
 */
export const empleadoRepository = {
  findByUsuario(usuario) {
    return Empleado.findOne({
      where: { usuario },
      include: [
        { model: Rol, as: 'rol' },
        { model: Sucursal, as: 'sucursal' },
      ],
    });
  },

  findById(id) {
    return Empleado.findByPk(id, {
      include: [
        { model: Rol, as: 'rol' },
        { model: Sucursal, as: 'sucursal' },
      ],
    });
  },

  async registrarIntentoFallido(empleado, { maxAttempts, lockMinutes }) {
    const intentos = empleado.intentos_fallidos + 1;
    const updates = { intentos_fallidos: intentos };
    if (intentos >= maxAttempts) {
      updates.bloqueado_hasta = new Date(Date.now() + lockMinutes * 60_000);
    }
    await empleado.update(updates);
    return empleado;
  },

  async resetIntentos(empleado) {
    if (empleado.intentos_fallidos !== 0 || empleado.bloqueado_hasta) {
      await empleado.update({ intentos_fallidos: 0, bloqueado_hasta: null });
    }
  },
};
