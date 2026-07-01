import { api } from './api.js';

export async function fetchDashboard({ gestion, mes }) {
  const { data } = await api.get('/dashboard', { params: { gestion, mes } });
  return data;
}
