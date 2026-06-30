import { useQuery } from '@tanstack/react-query';
import { librosApi } from '../services/libros.service.js';

export function useLibroDiario(filtros = {}, options = {}) {
  return useQuery({
    queryKey: ['libros', 'diario', filtros],
    queryFn: () => librosApi.getLibroDiario(filtros),
    ...options,
  });
}

export function useLibroMayor(filtros = {}, options = {}) {
  return useQuery({
    queryKey: ['libros', 'mayor', filtros],
    queryFn: () => librosApi.getLibroMayor(filtros),
    ...options,
  });
}
