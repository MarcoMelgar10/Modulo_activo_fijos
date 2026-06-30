import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cierresApi } from '../services/cierres.service.js';

export function useCierres() {
  return useQuery({ queryKey: ['cierres'], queryFn: cierresApi.listar });
}

export function useCerrarGestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cierresApi.cerrar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres'] });
      qc.invalidateQueries({ queryKey: ['asientos'] });
    },
  });
}
