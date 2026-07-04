import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  usuario: z
    .string()
    .trim()
    .min(4, 'El usuario debe tener al menos 4 caracteres')
    .max(50)
    .regex(/^\S+$/, 'El usuario no puede contener espacios'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  id_rol: z.number().int().positive('El rol es obligatorio'),
});

export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    apellido: z.string().trim().min(1).max(100).optional(),
    id_rol: z.number().int().positive().optional(),
    activo: z.boolean().optional(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });

export const cambiarEstadoSchema = z.object({
  activo: z.boolean(),
});
