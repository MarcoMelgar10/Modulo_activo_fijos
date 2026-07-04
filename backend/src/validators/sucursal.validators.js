import { z } from 'zod';

export const crearSucursalSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  ciudad: z.string().trim().min(1, 'La ciudad es obligatoria').max(80),
  direccion: z.string().trim().min(1, 'La dirección es obligatoria').max(200),
  telefono: z.string().trim().max(20).optional(),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO']).optional(),
});

export const actualizarSucursalSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    ciudad: z.string().trim().min(1).max(80).optional(),
    direccion: z.string().trim().min(1).max(200).optional(),
    telefono: z.string().trim().max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO']),
});
