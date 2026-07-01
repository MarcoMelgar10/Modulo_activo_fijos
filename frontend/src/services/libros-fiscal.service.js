import { api } from './api.js';

export async function fetchLibroCompras({ mes, gestion }) {
  const { data } = await api.get('/libros-fiscales/compras', { params: { mes, gestion } });
  return data;
}

export async function fetchLibroVentas({ mes, gestion }) {
  const { data } = await api.get('/libros-fiscales/ventas', { params: { mes, gestion } });
  return data;
}
