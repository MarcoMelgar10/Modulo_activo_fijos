import { api } from './api.js';

export const cuentasApi = {
  async listar() {
    const { data } = await api.get('/cuentas');
    return data.cuentas;
  },
  async arbol() {
    const { data } = await api.get('/cuentas/arbol');
    return data.arbol;
  },
  async crear(payload) {
    const { data } = await api.post('/cuentas', payload);
    return data.cuenta;
  },
};
