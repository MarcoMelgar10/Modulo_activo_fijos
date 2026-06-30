import { api } from './api.js';

export const librosApi = {
  async getLibroDiario(params = {}) {
    const { data } = await api.get('/libros/diario', { params });
    return data;
  },
  async getLibroMayor(params = {}) {
    const { data } = await api.get('/libros/mayor', { params });
    return data;
  },
};
