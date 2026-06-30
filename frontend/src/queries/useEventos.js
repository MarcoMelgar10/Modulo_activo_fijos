import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from '../services/eventos.service.js';

export function useSimularEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => eventosApi.simularEvento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asientos'] });
      queryClient.invalidateQueries({ queryKey: ['libros'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}
