import { api } from './api.js';

export const cierresApi = {
  async listar() {
    const { data } = await api.get('/cierres');
    return data.cierres;
  },
  async cerrar(anio) {
    const { data } = await api.post('/cierres', { anio });
    return data; // { cierre, asiento }
  },
};
