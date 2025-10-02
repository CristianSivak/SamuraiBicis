import { z } from '../../../../vendor/zod.js'

export const customerTypeFormSchema = z.object({
  nombre: z.string().min(2, 'Ingresá al menos 2 caracteres'),
  descripcion: z.string().optional(),
  descuentoPorcentaje: z
    .number()
    .min(0, 'El descuento debe ser como mínimo 0%')
    .max(100, 'El descuento debe ser como máximo 100%')
    .refine((value) => {
      const [, decimalPart = ''] = String(value).split('.')
      return decimalPart.length <= 2
    }, 'Máximo dos decimales'),
  activo: z.boolean(),
})
