import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
  .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida');

export const crearVentaSchema = z.object({
  id_sucursal: z.number().int().positive().optional(),
  fecha: fecha.optional(),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'QR']).optional(),
  descuento: z.number().nonnegative('El descuento no puede ser negativo').optional(),
  lineas: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive('La cantidad debe ser mayor a cero'),
        precio_unitario: z.number().positive().optional(),
      }),
    )
    .min(1, 'La venta requiere al menos una línea'),
});

export const crearDevolucionSchema = z.object({
  id_venta: z.number().int().positive('La venta es obligatoria'),
  motivo: z.string().trim().min(1, 'El motivo es obligatorio').max(500),
  fecha: fecha.optional(),
  lineas: z
    .array(
      z.object({
        id_detalle_venta: z.number().int().positive(),
        cantidad_dev: z.number().int().positive('La cantidad a devolver debe ser mayor a cero'),
      }),
    )
    .min(1, 'La devolución requiere al menos una línea'),
});
