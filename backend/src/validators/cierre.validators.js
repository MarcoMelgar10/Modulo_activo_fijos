import { z } from 'zod';

const anioActual = new Date().getFullYear();

export const cerrarGestionSchema = z.object({
  anio: z
    .number({ invalid_type_error: 'El año es obligatorio y debe ser numérico' })
    .int('El año debe ser un entero')
    .gte(2000, 'Año fuera de rango')
    .lte(anioActual, 'No se puede cerrar una gestión futura'),
});
