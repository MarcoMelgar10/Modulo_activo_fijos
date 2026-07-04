import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accesosBiometricosApi } from '../services/accesos-biometricos.service.js';

export function useAccesosBiometricos(params) {
  return useQuery({
    queryKey: ['accesos-biometricos', params ?? {}],
    queryFn: () => accesosBiometricosApi.listar(params),
  });
}

export function useSimularAcceso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accesosBiometricosApi.simular,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accesos-biometricos'] }),
  });
}
