import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  gestion: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12).optional().default(new Date().getMonth() + 1),
});
