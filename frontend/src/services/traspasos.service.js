import { api } from './api.js';

export const traspasosApi = {
  async listar() {
    const { data } = await api.get('/traspasos');
    return data.traspasos;
  },

  async obtener(id) {
    const { data } = await api.get(`/traspasos/${id}`);
    return data.traspaso;
  },

  async crear(payload) {
    const { data } = await api.post('/traspasos', payload);
    return data.traspaso;
  },

  async enviar(id) {
    const { data } = await api.post(`/traspasos/${id}/enviar`);
    return data.traspaso;
  },

  async recibir(id, fecha_recepcion) {
    const { data } = await api.post(`/traspasos/${id}/recibir`, { fecha_recepcion });
    return data.traspaso;
  },

  async cancelar(id, motivo_cancelacion) {
    const { data } = await api.post(`/traspasos/${id}/cancelar`, { motivo_cancelacion });
    return data.traspaso;
  },
};
