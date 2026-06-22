import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { asientosApi } from '../services/asientos.service.js';

export function useAsientos(filtros = {}) {
  return useQuery({
    queryKey: ['asientos', filtros],
    queryFn: () => asientosApi.listar(filtros),
  });
}

function useAsientoMutation(fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asientos'] }),
  });
}

export const useCrearAsiento = () => useAsientoMutation(asientosApi.crear);
export const useConfirmarAsiento = () => useAsientoMutation(asientosApi.confirmar);
export const useAnularAsiento = () => useAsientoMutation(asientosApi.anular);
