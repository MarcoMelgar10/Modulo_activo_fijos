import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchDashboardGerencial } from '../services/dashboard.service.js';

export function useDashboard({ gestion, mes }) {
  return useQuery({
    queryKey: ['dashboard', gestion, mes],
    queryFn: () => fetchDashboard({ gestion, mes }),
    staleTime: 30_000,
  });
}

export function useDashboardGerencial(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'gerencial'],
    queryFn: fetchDashboardGerencial,
    staleTime: 30_000,
    ...options,
  });
}
