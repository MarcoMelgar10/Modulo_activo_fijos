import { z } from 'zod';

export const registrarPagoSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a cero'),
  fecha_pago: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD')
    .refine((f) => !isNaN(Date.parse(f)), 'Fecha inválida')
    .optional(),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA']).optional(),
});
