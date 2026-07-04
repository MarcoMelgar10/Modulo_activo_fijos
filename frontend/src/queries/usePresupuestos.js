import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presupuestosApi } from '../services/presupuestos.service.js';

export function usePresupuestos(params) {
  return useQuery({ queryKey: ['presupuestos', params ?? {}], queryFn: () => presupuestosApi.listar(params) });
}

export function useEjecucionPresupuesto(id, options = {}) {
  return useQuery({
    queryKey: ['presupuestos', 'ejecucion', id],
    queryFn: () => presupuestosApi.ejecucion(id),
    ...options,
  });
}

function invalidar(qc) {
  qc.invalidateQueries({ queryKey: ['presupuestos'] });
}

export function useCrearPresupuesto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: presupuestosApi.crear, onSuccess: () => invalidar(qc) });
}

export function useActualizarPresupuesto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => presupuestosApi.actualizar(id, payload), onSuccess: () => invalidar(qc) });
}

export function useAprobarPresupuesto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: presupuestosApi.aprobar, onSuccess: () => invalidar(qc) });
}

export function useRechazarPresupuesto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }) => presupuestosApi.rechazar(id, payload), onSuccess: () => invalidar(qc) });
}
