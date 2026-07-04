import { z } from 'zod';
import { TIPOS_ORIGEN } from '../models/AsientoContable.js';

const lineaSchema = z.object({
  id_cuenta: z.number().int().positive(),
  descripcion: z.string().trim().max(200).optional(),
  debe: z.number().nonnegative().default(0),
  haber: z.number().nonnegative().default(0),
});

export const crearAsientoSchema = z.object({
  id_sucursal: z.number().int().positive(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
    .refine((f) => new Date(f) <= new Date(), 'La fecha no puede ser futura'),
  concepto: z.string().trim().min(1, 'El concepto es obligatorio'),
  tipo_origen: z.enum(TIPOS_ORIGEN).optional(),
  id_referencia: z.number().int().positive().nullable().optional(),
  lineas: z.array(lineaSchema).min(2, 'Un asiento requiere al menos dos líneas'),
});
