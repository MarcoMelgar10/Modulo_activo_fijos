import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Esquema base para filtros de fecha y sucursal (compartido por Diario y Mayor).
 */
const filtrosFechaBase = {
  fecha_inicio: z
    .string()
    .regex(fechaRegex, 'Formato requerido: AAAA-MM-DD')
    .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida'),
  fecha_fin: z
    .string()
    .regex(fechaRegex, 'Formato requerido: AAAA-MM-DD')
    .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida'),
  id_sucursal: z.coerce.number().int().positive().optional(),
};

/**
 * Validador de query para GET /api/libros/diario.
 */
export const libroDiarioQuerySchema = z
  .object(filtrosFechaBase)
  .refine((d) => d.fecha_inicio <= d.fecha_fin, {
    message: 'fecha_inicio debe ser menor o igual a fecha_fin',
    path: ['fecha_fin'],
  });

/**
 * Validador de query para GET /api/libros/mayor.
 * Añade id_cuenta obligatorio (se necesita la cuenta analítica).
 */
export const libroMayorQuerySchema = z
  .object({
    ...filtrosFechaBase,
    id_cuenta: z.coerce.number().int().positive({ message: 'id_cuenta es obligatorio para el Libro Mayor' }),
  })
  .refine((d) => d.fecha_inicio <= d.fecha_fin, {
    message: 'fecha_inicio debe ser menor o igual a fecha_fin',
    path: ['fecha_fin'],
  });
