import { useQuery } from '@tanstack/react-query';
import { inventarioApi } from '../services/inventario.service.js';

export function useInventarioLotes(params) {
  return useQuery({
    queryKey: ['inventario', 'lotes', params ?? {}],
    queryFn: () => inventarioApi.listarLotes(params),
  });
}

export function useInventarioStock(params) {
  return useQuery({
    queryKey: ['inventario', 'stock', params ?? {}],
    queryFn: () => inventarioApi.getStock(params),
  });
}

export function useStockProducto(id_producto) {
  return useQuery({
    queryKey: ['inventario', 'stock-producto', id_producto],
    queryFn: () => inventarioApi.getStockProducto(id_producto),
    enabled: Boolean(id_producto),
  });
}
