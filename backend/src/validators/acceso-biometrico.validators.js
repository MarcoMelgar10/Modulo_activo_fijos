import { z } from 'zod';

export const crearDispositivoSchema = z.object({
  dispositivo_id: z.string().trim().min(1).max(50),
  id_sucursal: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(100),
  ubicacion: z.string().trim().max(150).optional(),
  secret: z.string().min(6, 'El secreto debe tener al menos 6 caracteres'),
});

export const actualizarDispositivoSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    ubicacion: z.string().trim().max(150).optional(),
    id_sucursal: z.number().int().positive().optional(),
    secret: z.string().min(6).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay cambios para aplicar' });

export const cambiarEstadoDispositivoSchema = z.object({
  activo: z.boolean(),
});

export const simularAccesoSchema = z.object({
  dispositivo_id: z.string().trim().min(1),
  id_empleado: z.number().int().positive(),
  tipo_movimiento: z.enum(['ENTRADA', 'SALIDA']),
  fecha_hora: z.string().datetime().optional(),
});

export const eventoDispositivoSchema = z.object({
  id_empleado: z.number().int().positive(),
  tipo_movimiento: z.enum(['ENTRADA', 'SALIDA']),
  fecha_hora: z.string().datetime().optional(),
});

export const listarAccesosQuery = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
  id_empleado: z.coerce.number().int().positive().optional(),
  dispositivo_id: z.string().optional(),
  tipo_movimiento: z.enum(['ENTRADA', 'SALIDA']).optional(),
  resultado: z.coerce.boolean().optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
