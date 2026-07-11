import { api } from './api.js';

export async function fetchDashboardGerencial() {
  const { data } = await api.get('/dashboard/gerencial');
  return data;
}
