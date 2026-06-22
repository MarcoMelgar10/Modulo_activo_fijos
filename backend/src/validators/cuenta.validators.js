import { z } from 'zod';
import { TIPOS_CUENTA } from '../models/CuentaContable.js';

export const crearCuentaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(20)
    .regex(/^[0-9.]+$/, 'El código solo admite números y puntos'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  tipo: z.enum(TIPOS_CUENTA).optional(),
  id_cuenta_padre: z.number().int().positive().nullable().optional(),
  permite_movimiento: z.boolean().optional(),
});

export const actualizarCuentaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(150).optional(),
    permite_movimiento: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });
