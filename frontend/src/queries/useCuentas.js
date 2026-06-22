import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cuentasApi } from '../services/cuentas.service.js';

export function useArbolCuentas() {
  return useQuery({ queryKey: ['cuentas', 'arbol'], queryFn: cuentasApi.arbol });
}

export function useCuentasPlanas() {
  return useQuery({ queryKey: ['cuentas', 'lista'], queryFn: cuentasApi.listar });
}

export function useCrearCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cuentasApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
  });
}
