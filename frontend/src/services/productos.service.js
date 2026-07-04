import { api } from './api.js';

export const productosApi = {
  async listar(params) {
    const { data } = await api.get('/productos', { params });
    return data.productos;
  },
  async crear(payload) {
    const { data } = await api.post('/productos', payload);
    return data.producto;
  },
  async actualizar(id, payload) {
    const { data } = await api.put(`/productos/${id}`, payload);
    return data.producto;
  },
  async eliminar(id) {
    await api.delete(`/productos/${id}`);
  },
  async listarCategorias() {
    const { data } = await api.get('/productos/categorias');
    return data.categorias;
  },
  async crearCategoria(payload) {
    const { data } = await api.post('/productos/categorias', payload);
    return data.categoria;
  },
};
