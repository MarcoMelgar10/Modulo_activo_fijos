import { api } from './api.js';

export const ventasApi = {
  async listar(params) {
    const { data } = await api.get('/ventas', { params });
    return data.ventas;
  },
  async obtener(id) {
    const { data } = await api.get(`/ventas/${id}`);
    return data.venta;
  },
  async reporte(params) {
    const { data } = await api.get('/ventas/reporte', { params });
    return data;
  },
  async crear(payload) {
    const { data } = await api.post('/ventas', payload);
    return data.venta;
  },
  async crearDevolucion(payload) {
    const { data } = await api.post('/ventas/devoluciones', payload);
    return data.devolucion;
  },
};
