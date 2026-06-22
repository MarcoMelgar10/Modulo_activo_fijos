import axios from 'axios';

/**
 * Cliente HTTP único de la aplicación (uniformidad). El token JWT se inyecta
 * desde el AuthContext (Etapa 1). Errores 401 se podrán manejar globalmente.
 */
// baseURL relativo: en desarrollo lo resuelve el proxy de Vite (/api → :4000) y en
// producción el proxy de nginx (/api → backend:4000). No requiere variables de entorno.
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
