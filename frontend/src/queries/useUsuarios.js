import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../services/usuarios.service.js';

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.listar });
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: usuariosApi.roles });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuariosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useActualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => usuariosApi.actualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useCambiarEstadoUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }) => usuariosApi.cambiarEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}
