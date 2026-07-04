import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError.js';
import { accesoBiometricoRepository } from '../repositories/acceso-biometrico.repository.js';
import { dispositivoBiometricoRepository } from '../repositories/dispositivo-biometrico.repository.js';

export function createAccesoBiometricoService({
  repo = accesoBiometricoRepository,
  dispositivoRepo = dispositivoBiometricoRepository,
  hasher = bcrypt,
} = {}) {
  async function autorizar(dispositivo_id, id_empleado, tipo_movimiento, empleadoRepo) {
    const dispositivo = await dispositivoRepo.findById(dispositivo_id);
    if (!dispositivo) return { autorizado: false, mensaje: 'DISPOSITIVO_NO_ENCONTRADO', dispositivo: null };
    if (!dispositivo.activo) return { autorizado: false, mensaje: 'DISPOSITIVO_INACTIVO', dispositivo };
    if (dispositivo.sucursal?.estado !== 'ACTIVA') return { autorizado: false, mensaje: 'SUCURSAL_INACTIVA', dispositivo };

    const empleado = await empleadoRepo?.findById(id_empleado);
    if (!empleado) return { autorizado: false, mensaje: 'EMPLEADO_NO_ENCONTRADO', dispositivo };
    if (!empleado.activo) return { autorizado: false, mensaje: 'EMPLEADO_INACTIVO', dispositivo };
    if (empleado.rol?.nombre !== 'BODEGUERO' && empleado.rol?.nombre !== 'GERENTE') {
      return { autorizado: false, mensaje: 'ROL_NO_AUTORIZADO', dispositivo };
    }
    if (empleado.rol?.nombre !== 'GERENTE' && Number(empleado.id_sucursal) !== Number(dispositivo.id_sucursal)) {
      return { autorizado: false, mensaje: 'SUCURSAL_DIFERENTE', dispositivo };
    }
    if (!['ENTRADA', 'SALIDA'].includes(tipo_movimiento)) {
      return { autorizado: false, mensaje: 'TIPO_INVALIDO', dispositivo };
    }

    return { autorizado: true, mensaje: 'ACCESO_AUTORIZADO', dispositivo };
  }

  async function registrarEvento(dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, empleadoRepo, esSimulado = false) {
    const { autorizado, mensaje, dispositivo } = await autorizar(dispositivo_id, id_empleado, tipo_movimiento, empleadoRepo);

    const acceso = await repo.create({
      id_empleado,
      id_sucursal: dispositivo?.id_sucursal || 0,
      fecha_hora: fecha_hora ? new Date(fecha_hora) : new Date(),
      tipo_movimiento,
      resultado: autorizado,
      dispositivo_id,
    });

    return { acceso, autorizado, mensaje };
  }

  return {
    listar(filtros, user) {
      const f = { ...filtros };
      if (user.rol !== 'GERENTE') {
        f.id_sucursal = Number(user.id_sucursal);
      }
      return repo.findAll(f);
    },

    async obtener(id, user) {
      const acceso = await repo.findById(id);
      if (!acceso) throw ApiError.notFound('Acceso no encontrado');
      if (user.rol !== 'GERENTE' && Number(acceso.id_sucursal) !== Number(user.id_sucursal)) {
        throw ApiError.forbidden('No tiene permisos para ver este acceso');
      }
      return acceso;
    },

    async registrarEventoDispositivo(dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, secret, empleadoRepo) {
      const dispositivo = await dispositivoRepo.findById(dispositivo_id);
      if (!dispositivo) throw ApiError.unauthorized('Dispositivo no autenticado');
      if (!dispositivo.activo) throw ApiError.forbidden('Dispositivo biométrico inactivo');
      const valido = await hasher.compare(secret, dispositivo.secret_hash);
      if (!valido) throw ApiError.unauthorized('Dispositivo no autenticado');
      return registrarEvento(dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, empleadoRepo, false);
    },

    async simular(dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, empleadoRepo) {
      return registrarEvento(dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, empleadoRepo, true);
    },

    autorizar,
  };
}

export const accesoBiometricoService = createAccesoBiometricoService();
