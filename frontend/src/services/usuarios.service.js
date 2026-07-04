import { api } from './api.js';

export const usuariosApi = {
  async listar() {
    const { data } = await api.get('/usuarios');
    return data.usuarios;
  },
  async roles() {
    const { data } = await api.get('/usuarios/roles');
    return data.roles;
  },
  async crear(payload) {
    const { data } = await api.post('/usuarios', payload);
    return data.usuario;
  },
  async actualizar(id, payload) {
    const { data } = await api.put(`/usuarios/${id}`, payload);
    return data.usuario;
  },
  async cambiarEstado(id, activo) {
    const { data } = await api.post(`/usuarios/${id}/estado`, { activo });
    return data.usuario;
  },
};
