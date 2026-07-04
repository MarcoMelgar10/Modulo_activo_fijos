import { api } from './api.js';

export const presupuestosApi = {
  async listar(params) {
    const { data } = await api.get('/presupuestos', { params });
    return data.presupuestos;
  },
  async obtener(id) {
    const { data } = await api.get(`/presupuestos/${id}`);
    return data.presupuesto;
  },
  async ejecucion(id) {
    const { data } = await api.get(`/presupuestos/${id}/ejecucion`);
    return data;
  },
  async crear(payload) {
    const { data } = await api.post('/presupuestos', payload);
    return data.presupuesto;
  },
  async actualizar(id, payload) {
    const { data } = await api.put(`/presupuestos/${id}`, payload);
    return data.presupuesto;
  },
  async aprobar(id) {
    const { data } = await api.post(`/presupuestos/${id}/aprobar`);
    return data.presupuesto;
  },
  async rechazar(id, payload) {
    const { data } = await api.post(`/presupuestos/${id}/rechazar`, payload);
    return data.presupuesto;
  },
};
