import { api } from './api.js';

export const cuentasPorPagarApi = {
  async listar(params) {
    const { data } = await api.get('/cuentas-por-pagar', { params });
    return data.cuentas;
  },
  async obtener(id) {
    const { data } = await api.get(`/cuentas-por-pagar/${id}`);
    return data.cxp;
  },
  async registrarPago(id, payload) {
    const { data } = await api.post(`/cuentas-por-pagar/${id}/pagos`, payload);
    return data.cxp;
  },
};
