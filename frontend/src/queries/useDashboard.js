import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../services/dashboard.service.js';

export function useDashboard({ gestion, mes }) {
  return useQuery({
    queryKey: ['dashboard', gestion, mes],
    queryFn: () => fetchDashboard({ gestion, mes }),
    staleTime: 30_000,
  });
}
