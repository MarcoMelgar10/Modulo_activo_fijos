import { api } from './api.js';

export const authApi = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    return data; // { token, usuario }
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.usuario;
  },
  async logout() {
    await api.post('/auth/logout');
  },
};
