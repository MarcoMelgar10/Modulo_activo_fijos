import { ApiError } from '../utils/ApiError.js';
import { proveedorRepository } from '../repositories/proveedor.repository.js';

/**
 * Reglas de negocio de proveedores (RF-COM-01):
 * - El NIT es único.
 * - La baja es lógica (activo = false), no física, para preservar la
 *   trazabilidad de las órdenes de compra históricas.
 */
export function createProveedorService({ repo = proveedorRepository } = {}) {
  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const proveedor = await repo.findById(id);
      if (!proveedor) throw ApiError.notFound('Proveedor no encontrado');
      return proveedor;
    },

    async crear(data) {
      if (await repo.findByNit(data.nit)) {
        throw ApiError.conflict(`Ya existe un proveedor con el NIT ${data.nit}`);
      }
      return repo.create(data);
    },

    async actualizar(id, cambios) {
      const proveedor = await this.obtener(id);
      if (cambios.nit && cambios.nit !== proveedor.nit) {
        const existente = await repo.findByNit(cambios.nit);
        if (existente && existente.id_proveedor !== proveedor.id_proveedor) {
          throw ApiError.conflict(`Ya existe un proveedor con el NIT ${cambios.nit}`);
        }
      }
      await proveedor.update(cambios);
      return proveedor;
    },

    async eliminar(id) {
      // Baja lógica: no se borra físicamente para no romper FKs de órdenes/lotes.
      const proveedor = await this.obtener(id);
      await proveedor.update({ activo: false });
      return proveedor;
    },
  };
}

export const proveedorService = createProveedorService();
