import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { traspasosApi } from '../services/traspasos.service.js';

export function useTraspasos() {
  return useQuery({
    queryKey: ['traspasos'],
    queryFn: () => traspasosApi.listar(),
  });
}

export function useCrearTraspaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: traspasosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['traspasos'] }),
  });
}

export function useEnviarTraspaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => traspasosApi.enviar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['traspasos'] });
      qc.invalidateQueries({ queryKey: ['inventario'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRecibirTraspaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fecha_recepcion }) => traspasosApi.recibir(id, fecha_recepcion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['traspasos'] });
      qc.invalidateQueries({ queryKey: ['inventario'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelarTraspaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) => traspasosApi.cancelar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['traspasos'] });
      qc.invalidateQueries({ queryKey: ['inventario'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
