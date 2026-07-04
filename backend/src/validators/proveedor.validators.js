import { z } from 'zod';

export const crearProveedorSchema = z.object({
  razon_social: z.string().trim().min(1, 'La razón social es obligatoria').max(150),
  nit: z
    .string()
    .trim()
    .min(1, 'El NIT es obligatorio')
    .max(20)
    .regex(/^[0-9-]+$/, 'El NIT solo admite números y guiones'),
  contacto: z.string().trim().max(100).optional(),
  telefono: z.string().trim().max(20).optional(),
  email: z.string().trim().email('Email inválido').max(120).optional().or(z.literal('')),
  ciudad: z.string().trim().max(80).optional(),
});

export const actualizarProveedorSchema = z
  .object({
    razon_social: z.string().trim().min(1).max(150).optional(),
    nit: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .regex(/^[0-9-]+$/, 'El NIT solo admite números y guiones')
      .optional(),
    contacto: z.string().trim().max(100).optional(),
    telefono: z.string().trim().max(20).optional(),
    email: z.string().trim().email('Email inválido').max(120).optional().or(z.literal('')),
    ciudad: z.string().trim().max(80).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });
