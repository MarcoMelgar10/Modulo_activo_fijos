import { inventarioRepository } from '../repositories/inventario.repository.js';

export function createInventarioService({ repo = inventarioRepository } = {}) {
  return {
    listarLotes(filtros, user) {
      const f = { ...filtros };
      if (user?.rol !== 'GERENTE' && user?.rol !== 'CONTADOR') {
        f.id_sucursal = Number(user.id_sucursal);
      }
      return repo.findLotes(f);
    },

    getStockAgregado(filtros, user) {
      const f = { ...filtros };
      if (user?.rol !== 'GERENTE' && user?.rol !== 'CONTADOR') {
        f.id_sucursal = Number(user.id_sucursal);
      }
      return repo.getStockAgregado(f);
    },

    getStockProducto(id_producto) {
      return repo.getStockProducto(id_producto);
    },
  };
}

export const inventarioService = createInventarioService();
