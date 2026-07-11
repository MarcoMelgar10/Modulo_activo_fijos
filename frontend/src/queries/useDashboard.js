import { useQuery } from '@tanstack/react-query';
import { fetchDashboardGerencial } from '../services/dashboard.service.js';

export function useDashboardGerencial(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'gerencial'],
    queryFn: fetchDashboardGerencial,
    staleTime: 30_000,
    ...options,
  });
}
