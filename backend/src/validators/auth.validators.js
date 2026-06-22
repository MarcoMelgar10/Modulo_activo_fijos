import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string().trim().min(4, 'El usuario debe tener al menos 4 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
