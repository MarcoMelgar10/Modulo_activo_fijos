import { api } from './api.js';

export const ordenesCompraApi = {
  async listar(params) {
    const { data } = await api.get('/ordenes-compra', { params });
    return data.ordenes;
  },
  async obtener(id) {
    const { data } = await api.get(`/ordenes-compra/${id}`);
    return data.orden;
  },
  async crear(payload) {
    const { data } = await api.post('/ordenes-compra', payload);
    return data.orden;
  },
  async enviar(id) {
    const { data } = await api.post(`/ordenes-compra/${id}/enviar`);
    return data.orden;
  },
  async recibir(id, payload) {
    const { data } = await api.post(`/ordenes-compra/${id}/recibir`, payload);
    return data.orden;
  },
  async cancelar(id) {
    const { data } = await api.post(`/ordenes-compra/${id}/cancelar`);
    return data.orden;
  },
};
