import { api } from './api.js';

export const inventarioApi = {
  async listarLotes(params) {
    const { data } = await api.get('/inventario/lotes', { params });
    return data.lotes;
  },

  async getStock(params) {
    const { data } = await api.get('/inventario/stock', { params });
    return data.stock;
  },

  async getStockProducto(id_producto) {
    const { data } = await api.get(`/inventario/productos/${id_producto}/stock`);
    return data.lotes;
  },
};
