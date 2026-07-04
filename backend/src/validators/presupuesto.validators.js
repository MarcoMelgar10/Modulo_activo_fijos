import { z } from 'zod';

const lineaSchema = z.object({
  id_cuenta: z.number().int().positive(),
  monto_planificado: z.number().nonnegative('El monto no puede ser negativo'),
});

export const crearPresupuestoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  gestion: z.number().int().min(2000).max(2100),
  lineas: z.array(lineaSchema).min(1, 'El presupuesto requiere al menos una línea'),
});

export const actualizarPresupuestoSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120).optional(),
    lineas: z.array(lineaSchema).min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay cambios para aplicar' });

export const rechazarPresupuestoSchema = z.object({
  observacion: z.string().trim().max(500).optional(),
});
