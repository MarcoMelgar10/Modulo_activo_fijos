import { api } from './api.js';

export const sucursalesApi = {
  async listar() {
    const { data } = await api.get('/sucursales');
    return data.sucursales;
  },

  async obtener(id) {
    const { data } = await api.get(`/sucursales/${id}`);
    return data.sucursal;
  },

  async crear(payload) {
    const { data } = await api.post('/sucursales', payload);
    return data.sucursal;
  },

  async actualizar(id, payload) {
    const { data } = await api.put(`/sucursales/${id}`, payload);
    return data.sucursal;
  },

  async cambiarEstado(id, estado) {
    const { data } = await api.post(`/sucursales/${id}/estado`, { estado });
    return data.sucursal;
  },
};
