import { api } from './api.js';

export const auditoriaApi = {
  async listar(params) {
    const { data } = await api.get('/auditoria', { params });
    return data.logs;
  },
  async modulos() {
    const { data } = await api.get('/auditoria/modulos');
    return data.modulos;
  },
};
