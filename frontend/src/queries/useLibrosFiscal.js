import { useQuery } from '@tanstack/react-query';
import { fetchLibroCompras, fetchLibroVentas } from '../services/libros-fiscal.service.js';

export function useLibroCompras({ mes, gestion }) {
  return useQuery({
    queryKey: ['libro-compras', mes, gestion],
    queryFn: () => fetchLibroCompras({ mes, gestion }),
    staleTime: 30_000,
  });
}

export function useLibroVentas({ mes, gestion }) {
  return useQuery({
    queryKey: ['libro-ventas', mes, gestion],
    queryFn: () => fetchLibroVentas({ mes, gestion }),
    staleTime: 30_000,
  });
}
