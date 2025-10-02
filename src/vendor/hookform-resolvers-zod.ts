import { ZodError, ZodSchema, ZodTypeAny } from './zod'

type ResolverResult<T> = Promise<{
  values: T | {}
  errors: Record<string, { message: string }>
}>

export function zodResolver<T extends ZodTypeAny>(schema: ZodSchema<any>): (values: any) => ResolverResult<T> {
  return async (values: any) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    const errorMap: Record<string, { message: string }> = {}
    const error = result.error as ZodError
    for (const issue of error.issues) {
      const key = issue.path.filter((segment) => typeof segment === 'string').join('.')
      if (!errorMap[key]) {
        errorMap[key] = { message: issue.message }
      }
    }
    return { values: {}, errors: errorMap }
  }
}
