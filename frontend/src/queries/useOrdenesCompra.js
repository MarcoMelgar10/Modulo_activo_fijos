import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordenesCompraApi } from '../services/ordenes-compra.service.js';

export function useOrdenesCompra(params) {
  return useQuery({
    queryKey: ['ordenes-compra', params ?? {}],
    queryFn: () => ordenesCompraApi.listar(params),
  });
}

// Al recibir una orden se generan asientos y CxP: invalidamos también esas cachés.
function invalidarCompras(qc) {
  qc.invalidateQueries({ queryKey: ['ordenes-compra'] });
  qc.invalidateQueries({ queryKey: ['cuentas-por-pagar'] });
  qc.invalidateQueries({ queryKey: ['asientos'] });
  qc.invalidateQueries({ queryKey: ['libros'] });
  qc.invalidateQueries({ queryKey: ['reportes'] });
}

export function useCrearOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordenesCompraApi.crear,
    onSuccess: () => invalidarCompras(qc),
  });
}

export function useEnviarOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordenesCompraApi.enviar,
    onSuccess: () => invalidarCompras(qc),
  });
}

export function useRecibirOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => ordenesCompraApi.recibir(id, payload),
    onSuccess: () => invalidarCompras(qc),
  });
}

export function useCancelarOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordenesCompraApi.cancelar,
    onSuccess: () => invalidarCompras(qc),
  });
}
