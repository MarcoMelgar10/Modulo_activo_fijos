import { api } from './api.js';

export const dispositivosBiometricosApi = {
  async listar() {
    const { data } = await api.get('/dispositivos-biometricos');
    return data.dispositivos;
  },

  async crear(payload) {
    const { data } = await api.post('/dispositivos-biometricos', payload);
    return data.dispositivo;
  },

  async cambiarEstado(id, activo) {
    const { data } = await api.post(`/dispositivos-biometricos/${id}/estado`, { activo });
    return data.dispositivo;
  },
};
