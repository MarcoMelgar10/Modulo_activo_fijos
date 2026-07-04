import { api } from './api.js';

export const proveedoresApi = {
  async listar(params) {
    const { data } = await api.get('/proveedores', { params });
    return data.proveedores;
  },
  async crear(payload) {
    const { data } = await api.post('/proveedores', payload);
    return data.proveedor;
  },
  async actualizar(id, payload) {
    const { data } = await api.put(`/proveedores/${id}`, payload);
    return data.proveedor;
  },
  async eliminar(id) {
    await api.delete(`/proveedores/${id}`);
  },
};
