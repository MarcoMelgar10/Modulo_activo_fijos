import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosApi } from '../services/productos.service.js';

export function useProductos(params) {
  return useQuery({
    queryKey: ['productos', params ?? {}],
    queryFn: () => productosApi.listar(params),
  });
}

export function useCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: productosApi.listarCategorias });
}

export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useActualizarProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => productosApi.actualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useEliminarProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productosApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });
}

export function useCrearCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productosApi.crearCategoria,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  });
}
