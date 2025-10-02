import type { ZodSchema } from 'zod'

export interface CustomerTypeFormValues {
  nombre: string
  descripcion?: string
  descuentoPorcentaje: number
  activo: boolean
}

export const customerTypeFormSchema: ZodSchema<CustomerTypeFormValues>
