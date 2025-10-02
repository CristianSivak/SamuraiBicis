export class ZodError extends Error {
  issues: Array<{ path: Array<string | number>; message: string }>
}

export interface ZodSchema<T = any> {
  safeParse: (values: unknown) => { success: true; data: T } | { success: false; error: ZodError }
  optional: () => ZodSchema<T | undefined>
  refine: (check: (value: T) => boolean, message: string) => ZodSchema<T>
}

export type ZodTypeAny = ZodSchema<any>

export const z: {
  string: () => ZodSchema<string> & {
    min: (value: number, message?: string) => ZodSchema<string>
    max: (value: number, message?: string) => ZodSchema<string>
    optional: () => ZodSchema<string | undefined>
    refine: (check: (value: string) => boolean, message: string) => ZodSchema<string>
  }
  number: () => ZodSchema<number> & {
    min: (value: number, message?: string) => ZodSchema<number>
    max: (value: number, message?: string) => ZodSchema<number>
    optional: () => ZodSchema<number | undefined>
    refine: (check: (value: number) => boolean, message: string) => ZodSchema<number>
  }
  boolean: () => ZodSchema<boolean>
  object: (shape: Record<string, ZodSchema<any>>) => ZodSchema<any>
}
