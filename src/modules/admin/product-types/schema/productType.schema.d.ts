import type { ZodSchema } from 'zod'

export interface ProductTypeFormValues {
  nombre: string
  descripcion?: string
  activo: boolean
}

export const productTypeFormSchema: ZodSchema<ProductTypeFormValues>
