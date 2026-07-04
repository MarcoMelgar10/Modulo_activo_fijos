import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventasApi } from '../services/ventas.service.js';

export function useVentas(params) {
  return useQuery({
    queryKey: ['ventas', params ?? {}],
    queryFn: () => ventasApi.listar(params),
  });
}

export function useReporteVentas(params) {
  return useQuery({
    queryKey: ['ventas', 'reporte', params ?? {}],
    queryFn: () => ventasApi.reporte(params),
  });
}

// Ventas y devoluciones generan asientos y mueven stock: invalidamos esas cachés.
function invalidarVentas(qc) {
  qc.invalidateQueries({ queryKey: ['ventas'] });
  qc.invalidateQueries({ queryKey: ['productos'] });
  qc.invalidateQueries({ queryKey: ['asientos'] });
  qc.invalidateQueries({ queryKey: ['libros'] });
  qc.invalidateQueries({ queryKey: ['reportes'] });
}

export function useCrearVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ventasApi.crear,
    onSuccess: () => invalidarVentas(qc),
  });
}

export function useCrearDevolucion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ventasApi.crearDevolucion,
    onSuccess: () => invalidarVentas(qc),
  });
}
