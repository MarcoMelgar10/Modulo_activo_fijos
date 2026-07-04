import { api } from './api.js';

export const reportesApi = {
  async getBalanceGeneral(params = {}) {
    const { data } = await api.get('/reportes/balance-general', { params });
    return data;
  },
  async getEstadoResultados(params = {}) {
    const { data } = await api.get('/reportes/estado-resultados', { params });
    return data;
  },
  async getFlujoCaja(params = {}) {
    const { data } = await api.get('/reportes/flujo-caja', { params });
    return data;
  },
};
