import { ApiError } from '../utils/ApiError.js';
import { productoRepository } from '../repositories/producto.repository.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';

/**
 * Reglas de negocio del catálogo de productos (RF-INV-01):
 * - Código de barras único.
 * - La categoría debe existir.
 * - precio_venta debe ser mayor que precio_compra (regla del diccionario §3.6.2.2).
 * - La baja es lógica (activo = false) para no romper FKs de lotes/órdenes.
 */
export function createProductoService({
  repo = productoRepository,
  categoriaRepo = categoriaRepository,
} = {}) {
  async function validarReglas({ codigo_barras, id_categoria, precio_compra, precio_venta }, actual = null) {
    if (codigo_barras) {
      const existente = await repo.findByCodigoBarras(codigo_barras);
      if (existente && (!actual || existente.id_producto !== actual.id_producto)) {
        throw ApiError.conflict(`Ya existe un producto con el código de barras ${codigo_barras}`);
      }
    }
    if (id_categoria) {
      const categoria = await categoriaRepo.findById(id_categoria);
      if (!categoria) throw ApiError.badRequest('La categoría indicada no existe');
    }
    const compra = precio_compra ?? actual?.precio_compra;
    const venta = precio_venta ?? actual?.precio_venta;
    if (compra !== undefined && venta !== undefined && Number(venta) <= Number(compra)) {
      throw ApiError.badRequest('El precio de venta debe ser mayor que el precio de compra');
    }
  }

  return {
    listar(filtros) {
      return repo.findAll(filtros);
    },

    async obtener(id) {
      const producto = await repo.findById(id);
      if (!producto) throw ApiError.notFound('Producto no encontrado');
      return producto;
    },

    async crear(data) {
      await validarReglas(data);
      return repo.create(data);
    },

    async actualizar(id, cambios) {
      const producto = await this.obtener(id);
      await validarReglas(cambios, producto);
      await producto.update(cambios);
      return producto;
    },

    async eliminar(id) {
      const producto = await this.obtener(id);
      await producto.update({ activo: false });
      return producto;
    },
  };
}

export const productoService = createProductoService();
