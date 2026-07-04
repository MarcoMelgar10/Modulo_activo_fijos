import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
  .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida');

export const crearOrdenSchema = z.object({
  id_proveedor: z.number().int().positive('El proveedor es obligatorio'),
  id_sucursal: z.number().int().positive().optional(),
  fecha_emision: fecha,
  condicion_pago: z.enum(['CONTADO', 'CREDITO']).optional(),
  lineas: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive('La cantidad debe ser mayor a cero'),
        precio_unitario: z.number().positive('El precio unitario debe ser mayor a cero'),
      }),
    )
    .min(1, 'La orden requiere al menos una línea'),
});

export const recibirOrdenSchema = z.object({
  fecha_recepcion: fecha.optional(),
  lotes: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        numero_lote: z.string().trim().max(50).optional(),
        fecha_vencimiento: fecha.optional(),
      }),
    )
    .optional(),
});
