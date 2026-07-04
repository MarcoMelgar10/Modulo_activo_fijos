import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../services/reportes.service.js';

export function useBalanceGeneral(filtros = {}, options = {}) {
  return useQuery({
    queryKey: ['reportes', 'balance-general', filtros],
    queryFn: () => reportesApi.getBalanceGeneral(filtros),
    ...options,
  });
}

export function useEstadoResultados(filtros = {}, options = {}) {
  return useQuery({
    queryKey: ['reportes', 'estado-resultados', filtros],
    queryFn: () => reportesApi.getEstadoResultados(filtros),
    ...options,
  });
}

export function useFlujoCaja(filtros = {}, options = {}) {
  return useQuery({
    queryKey: ['reportes', 'flujo-caja', filtros],
    queryFn: () => reportesApi.getFlujoCaja(filtros),
    ...options,
  });
}
