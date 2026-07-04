import { z } from 'zod';

export const listarLotesQuery = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
  id_producto: z.coerce.number().int().positive().optional(),
  activo: z.coerce.boolean().optional(),
  solo_disponible: z.coerce.boolean().optional(),
  proximo_vencer_dias: z.coerce.number().int().positive().optional(),
});

export const stockQuery = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
  id_producto: z.coerce.number().int().positive().optional(),
});
