import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresApi } from '../services/proveedores.service.js';

export function useProveedores(params) {
  return useQuery({
    queryKey: ['proveedores', params ?? {}],
    queryFn: () => proveedoresApi.listar(params),
  });
}

export function useCrearProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: proveedoresApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}

export function useActualizarProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => proveedoresApi.actualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}

export function useEliminarProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: proveedoresApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}
