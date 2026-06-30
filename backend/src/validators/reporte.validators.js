import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validador de query para endpoints de reportes financieros
 * (Balance General y Estado de Resultados).
 */
export const reporteQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(fechaRegex, 'Formato requerido: AAAA-MM-DD')
      .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida'),
    fecha_fin: z
      .string()
      .regex(fechaRegex, 'Formato requerido: AAAA-MM-DD')
      .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida'),
    id_sucursal: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.fecha_inicio <= d.fecha_fin, {
    message: 'fecha_inicio debe ser menor o igual a fecha_fin',
    path: ['fecha_fin'],
  });
