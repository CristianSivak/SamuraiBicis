import { z } from '../../../../vendor/zod.js'

export const productTypeFormSchema = z.object({
  nombre: z.string().min(2, 'Ingresá al menos 2 caracteres'),
  descripcion: z.string().optional(),
  activo: z.boolean(),
})
