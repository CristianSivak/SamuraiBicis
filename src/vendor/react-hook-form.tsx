import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import type { FormEvent } from 'react'

type FieldError = {
  message?: string
}

type FieldErrors<T> = Partial<Record<keyof T & string, FieldError>> & Record<string, FieldError>

type Resolver<T> = (values: Partial<T>) => Promise<{
  values: Partial<T> | {}
  errors: FieldErrors<T>
}>

type UseFormOptions<T> = {
  defaultValues?: Partial<T>
  resolver?: Resolver<T>
}

type Control<T> = {
  values: Partial<T>
  setValue: (name: string, value: unknown) => void
  getError: (name: string) => FieldError | undefined
  subscribe: (callback: () => void) => () => void
}

type ControllerRenderProps = {
  field: {
    name: string
    value: any
    onChange: (value: any) => void
  }
  fieldState: {
    error?: FieldError
  }
}

type ControllerProps<T> = {
  name: keyof T & string
  control: Control<T>
  defaultValue?: any
  render: (props: ControllerRenderProps) => JSX.Element
}

type HandleSubmitOptions<T> = (values: T) => void | Promise<void>

type UseFormReturn<T> = {
  register: (name: keyof T & string) => {
    name: string
    value: any
    onChange: (event: any) => void
  }
  handleSubmit: (onValid: HandleSubmitOptions<T>) => (event?: FormEvent<HTMLFormElement>) => Promise<void>
  formState: {
    errors: FieldErrors<T>
    isSubmitting: boolean
    isValid: boolean
  }
  control: Control<T>
  watch: (name?: keyof T & string) => any
  setValue: (name: keyof T & string, value: any) => void
  reset: (nextValues?: Partial<T>) => void
  clearErrors: (name?: keyof T & string) => void
  setError: (name: keyof T & string, error: FieldError) => void
  getValues: () => Partial<T>
}

export function useForm<T extends Record<string, any> = Record<string, any>>({
  defaultValues,
  resolver,
}: UseFormOptions<T> = {}): UseFormReturn<T> {
  const [values, setValues] = useState<Partial<T>>(defaultValues ?? {})
  const [errors, setErrors] = useState<FieldErrors<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const subscribers = useRef(new Set<() => void>())

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value } as Partial<T>
      subscribers.current.forEach((cb) => cb())
      return next
    })
  }, [])

  const register = useCallback(
    (name: keyof T & string) => ({
      name,
      value: values[name] ?? '',
      onChange: (event: any) => {
        const nextValue = event?.target ? event.target.value : event
        setValue(name, nextValue)
      },
    }),
    [setValue, values],
  )

  const handleSubmit = useCallback(
    (onValid: HandleSubmitOptions<T>) =>
      async (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault()
        setIsSubmitting(true)
        try {
          const currentValues = values
          let resolved = { values: currentValues, errors: {} as FieldErrors<T> }
          if (resolver) {
            resolved = await resolver(currentValues)
          }
          if (Object.keys(resolved.errors).length > 0) {
            setErrors(resolved.errors)
            return
          }
          setErrors({})
          await onValid(resolved.values as T)
        } finally {
          setIsSubmitting(false)
        }
      },
    [resolver, values],
  )

  const reset = useCallback((nextValues?: Partial<T>) => {
    const base = nextValues ?? (defaultValues ?? {})
    setValues(base)
    setErrors({})
    subscribers.current.forEach((cb) => cb())
  }, [defaultValues])

  const clearErrors = useCallback((name?: keyof T & string) => {
    if (!name) {
      setErrors({})
      return
    }
    setErrors((prev) => {
      const { [name]: _omit, ...rest } = prev
      return rest
    })
  }, [])

  const setError = useCallback((name: keyof T & string, error: FieldError) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [])

  const control: Control<T> = useMemo(
    () => ({
      values,
      setValue,
      getError: (name: string) => errors[name],
      subscribe: (callback: () => void) => {
        subscribers.current.add(callback)
        return () => subscribers.current.delete(callback)
      },
    }),
    [errors, setValue, values],
  )

  const watch = useCallback(
    (name?: keyof T & string) => {
      if (!name) return values
      return values[name]
    },
    [values],
  )

  const formState = useMemo(
    () => ({
      errors,
      isSubmitting,
      isValid: Object.keys(errors).length === 0,
    }),
    [errors, isSubmitting],
  )

  return {
    register,
    handleSubmit,
    formState,
    control,
    watch,
    setValue: (name, value) => setValue(name, value),
    reset,
    clearErrors,
    setError,
    getValues: () => values,
  }
}

export function Controller<T extends Record<string, any>>({
  name,
  control,
  defaultValue,
  render,
}: ControllerProps<T>) {
  const [value, setLocalValue] = useState(control.values[name] ?? defaultValue ?? '')

  useEffect(() => {
    setLocalValue(control.values[name] ?? defaultValue ?? '')
  }, [control.values, defaultValue, name])

  useEffect(() => {
    const unsubscribe = control.subscribe(() => {
      setLocalValue(control.values[name] ?? defaultValue ?? '')
    })
    return unsubscribe
  }, [control, defaultValue, name])

  const handleChange = useCallback(
    (next: any) => {
      const valueToPersist = next?.target ? next.target.value : next
      control.setValue(name, valueToPersist)
      setLocalValue(valueToPersist)
    },
    [control, name],
  )

  return render({
    field: {
      name,
      value,
      onChange: handleChange,
    },
    fieldState: {
      error: control.getError(name),
    },
  })
}

export type FieldValues = Record<string, any>
