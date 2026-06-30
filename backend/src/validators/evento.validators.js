import { z } from 'zod';

const TIPOS_EVENTO = ['VENTA', 'COMPRA', 'DEVOLUCION', 'PAGO'];

export const eventoContableSchema = z.object({
  tipo: z.enum(TIPOS_EVENTO, {
    errorMap: () => ({ message: `El tipo debe ser uno de: ${TIPOS_EVENTO.join(', ')}` }),
  }),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
    .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida'),
  referencia_id: z.number().int().positive('referencia_id debe ser un entero positivo'),
  monto_total: z.number().positive('monto_total debe ser mayor a cero'),
  sucursal_id: z.number().int().positive('sucursal_id debe ser un entero positivo'),
  glosa: z.string().trim().max(500).optional(),
});
