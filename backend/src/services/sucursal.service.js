import { ApiError } from '../utils/ApiError.js';
import { sucursalRepository } from '../repositories/sucursal.repository.js';

export function createSucursalService({ repo = sucursalRepository } = {}) {
  return {
    listar(user) {
      if (user?.rol === 'GERENTE' || user?.rol === 'CONTADOR') {
        return repo.findAll();
      }
      return repo.findAll().then((rows) =>
        rows.filter((s) => s.id_sucursal === Number(user?.id_sucursal)),
      );
    },

    async obtener(id, user) {
      const sucursal = await repo.findById(id);
      if (!sucursal) throw ApiError.notFound('Sucursal no encontrada');
      if (user?.rol !== 'GERENTE' && user?.rol !== 'CONTADOR' &&
          Number(sucursal.id_sucursal) !== Number(user?.id_sucursal)) {
        throw ApiError.forbidden('No tiene permisos para ver otra sucursal');
      }
      return sucursal;
    },

    async crear(data) {
      const existente = await repo.findByNombre(data.nombre);
      if (existente) throw ApiError.conflict(`La sucursal "${data.nombre}" ya existe`);
      return repo.create(data);
    },

    async actualizar(id, changes) {
      const sucursal = await repo.findById(id);
      if (!sucursal) throw ApiError.notFound('Sucursal no encontrada');
      if (changes.nombre) {
        const duplicada = await repo.findByNombre(changes.nombre);
        if (duplicada && Number(duplicada.id_sucursal) !== Number(id)) {
          throw ApiError.conflict(`La sucursal "${changes.nombre}" ya existe`);
        }
      }
      await sucursal.update(changes);
      return repo.findById(id);
    },

    async cambiarEstado(id, estado) {
      const sucursal = await repo.findById(id);
      if (!sucursal) throw ApiError.notFound('Sucursal no encontrada');
      if (estado === 'INACTIVA' || estado === 'EN_MANTENIMIENTO') {
        const tieneOps = await repo.tieneOperacionesPendientes(id);
        if (tieneOps) {
          throw ApiError.conflict('No se puede inactivar: la sucursal tiene operaciones activas');
        }
      }
      await sucursal.update({ estado });
      return repo.findById(id);
    },
  };
}

export const sucursalService = createSucursalService();
