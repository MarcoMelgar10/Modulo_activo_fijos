import { api } from './api.js';

export const eventosApi = {
  async simularEvento(payload) {
    const { data } = await api.post('/eventos-contables', payload);
    return data;
  },
};
