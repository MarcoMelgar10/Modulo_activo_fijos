import { api } from './api.js';

export const accesosBiometricosApi = {
  async listar(params) {
    const { data } = await api.get('/accesos-biometricos', { params });
    return data.accesos;
  },

  async simular(payload) {
    const { data } = await api.post('/accesos-biometricos/simular', payload);
    return data;
  },
};
