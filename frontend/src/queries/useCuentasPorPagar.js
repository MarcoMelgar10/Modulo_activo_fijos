import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cuentasPorPagarApi } from '../services/cuentas-por-pagar.service.js';

export function useCuentasPorPagar(params) {
  return useQuery({
    queryKey: ['cuentas-por-pagar', params ?? {}],
    queryFn: () => cuentasPorPagarApi.listar(params),
  });
}

export function useRegistrarPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => cuentasPorPagarApi.registrarPago(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuentas-por-pagar'] });
      qc.invalidateQueries({ queryKey: ['asientos'] });
      qc.invalidateQueries({ queryKey: ['libros'] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}
