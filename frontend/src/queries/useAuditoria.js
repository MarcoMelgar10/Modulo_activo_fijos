import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../services/auditoria.service.js';

export function useAuditoria(params) {
  return useQuery({
    queryKey: ['auditoria', params ?? {}],
    queryFn: () => auditoriaApi.listar(params),
  });
}

export function useModulosAuditoria() {
  return useQuery({ queryKey: ['auditoria', 'modulos'], queryFn: auditoriaApi.modulos });
}
