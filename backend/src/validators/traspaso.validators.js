import { z } from 'zod';

const detalleTraspasoSchema = z.object({
  id_lote: z.number().int().positive(),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a cero'),
});

export const crearTraspasoSchema = z.object({
  id_sucursal_origen: z.number().int().positive(),
  id_sucursal_destino: z.number().int().positive(),
  motivo: z.string().trim().max(250).optional(),
  detalles: z.array(detalleTraspasoSchema).min(1, 'El traspaso requiere al menos un lote'),
}).refine((d) => d.id_sucursal_origen !== d.id_sucursal_destino, {
  message: 'La sucursal origen y destino deben ser diferentes',
  path: ['id_sucursal_destino'],
});

export const recibirTraspasoSchema = z.object({
  fecha_recepcion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const cancelarTraspasoSchema = z.object({
  motivo_cancelacion: z.string().trim().max(250).optional(),
});
