import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  descripcion: z.string().trim().max(200).optional(),
});

export const crearProductoSchema = z.object({
  id_categoria: z.number().int().positive('La categoría es obligatoria'),
  codigo_barras: z.string().trim().min(1, 'El código de barras es obligatorio').max(50),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  unidad_medida: z.string().trim().min(1).max(20).optional(),
  precio_compra: z.number().nonnegative('El precio de compra no puede ser negativo'),
  precio_venta: z.number().positive('El precio de venta debe ser mayor a cero'),
  stock_minimo: z.number().int().nonnegative().optional(),
});

export const actualizarProductoSchema = z
  .object({
    id_categoria: z.number().int().positive().optional(),
    codigo_barras: z.string().trim().min(1).max(50).optional(),
    nombre: z.string().trim().min(1).max(150).optional(),
    unidad_medida: z.string().trim().min(1).max(20).optional(),
    precio_compra: z.number().nonnegative().optional(),
    precio_venta: z.number().positive().optional(),
    stock_minimo: z.number().int().nonnegative().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });
