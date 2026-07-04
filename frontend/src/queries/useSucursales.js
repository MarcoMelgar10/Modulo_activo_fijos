import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesApi } from '../services/sucursales.service.js';

export function useSucursales() {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: () => sucursalesApi.listar(),
    staleTime: 60_000,
  });
}

export function useCrearSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sucursalesApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sucursales'] }),
  });
}

export function useActualizarSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => sucursalesApi.actualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sucursales'] }),
  });
}

export function useCambiarEstadoSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }) => sucursalesApi.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sucursales'] }),
  });
}
