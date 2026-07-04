import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError.js';
import { dispositivoBiometricoRepository } from '../repositories/dispositivo-biometrico.repository.js';
import { sucursalRepository } from '../repositories/sucursal.repository.js';

const COST = Number(process.env.BCRYPT_COST || 10);

export function createDispositivoBiometricoService({
  repo = dispositivoBiometricoRepository,
  sucursalRepo = sucursalRepository,
  hasher = bcrypt,
} = {}) {
  return {
    listar(id_sucursal) {
      return repo.findAll(id_sucursal);
    },

    async obtener(id) {
      const d = await repo.findById(id);
      if (!d) throw ApiError.notFound('Dispositivo no encontrado');
      return d;
    },

    async crear({ dispositivo_id, id_sucursal, nombre, ubicacion, secret }) {
      const existente = await repo.findById(dispositivo_id);
      if (existente) throw ApiError.conflict(`El dispositivo "${dispositivo_id}" ya existe`);
      const sucursal = await sucursalRepo.findById(id_sucursal);
      if (!sucursal) throw ApiError.badRequest('La sucursal no existe');
      if (sucursal.estado !== 'ACTIVA') throw ApiError.badRequest('La sucursal no está activa');
      const secret_hash = await hasher.hash(secret, COST);
      return repo.create({ dispositivo_id, id_sucursal, nombre, ubicacion, secret_hash, activo: true });
    },

    async actualizar(id, changes) {
      const d = await repo.findById(id);
      if (!d) throw ApiError.notFound('Dispositivo no encontrado');
      if (changes.secret) {
        changes.secret_hash = await hasher.hash(changes.secret, COST);
        delete changes.secret;
      }
      return repo.actualizar(id, changes);
    },

    async cambiarEstado(id, activo) {
      const d = await repo.findById(id);
      if (!d) throw ApiError.notFound('Dispositivo no encontrado');
      return repo.actualizar(id, { activo });
    },
  };
}

export const dispositivoBiometricoService = createDispositivoBiometricoService();
