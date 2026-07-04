import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispositivosBiometricosApi } from '../services/dispositivos-biometricos.service.js';

export function useDispositivosBiometricos() {
  return useQuery({
    queryKey: ['dispositivos-biometricos'],
    queryFn: () => dispositivosBiometricosApi.listar(),
  });
}

export function useCrearDispositivoBiometrico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dispositivosBiometricosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispositivos-biometricos'] }),
  });
}

export function useCambiarEstadoDispositivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }) => dispositivosBiometricosApi.cambiarEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispositivos-biometricos'] }),
  });
}
