import { api } from './api.js';

export const asientosApi = {
  async listar(params = {}) {
    const { data } = await api.get('/asientos', { params });
    return data.asientos;
  },
  async crear(payload) {
    const { data } = await api.post('/asientos', payload);
    return data.asiento;
  },
  async confirmar(id) {
    const { data } = await api.post(`/asientos/${id}/confirmar`);
    return data.asiento;
  },
  async anular(id) {
    const { data } = await api.post(`/asientos/${id}/anular`);
    return data.asiento;
  },
};
