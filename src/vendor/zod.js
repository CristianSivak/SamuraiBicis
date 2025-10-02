export class ZodError extends Error {
  constructor(issues) {
    super(issues?.[0]?.message || 'Validation error')
    this.name = 'ZodError'
    this.issues = issues || []
  }
}

class ZodType {
  parse(value) {
    const result = this.safeParse(value)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }

  safeParse(value) {
    const issues = []
    const data = this._parse(value, issues, [])
    if (issues.length) {
      return { success: false, error: new ZodError(issues) }
    }
    return { success: true, data }
  }

  optional() {
    return new ZodOptional(this)
  }

  refine(check, message) {
    return new ZodEffects(this, check, message)
  }
}

class ZodOptional extends ZodType {
  constructor(inner) {
    super()
    this.inner = inner
  }

  _parse(value, issues, path) {
    if (value === undefined || value === null || value === '') {
      return undefined
    }
    return this.inner._parse(value, issues, path)
  }
}

class ZodEffects extends ZodType {
  constructor(inner, check, message) {
    super()
    this.inner = inner
    this.check = check
    this.message = message
  }

  _parse(value, issues, path) {
    const data = this.inner._parse(value, issues, path)
    if (data !== undefined && !this.check(data)) {
      issues.push({ path, message: this.message })
    }
    return data
  }
}

class ZodString extends ZodType {
  constructor() {
    super()
    this.minLength = null
    this.maxLength = null
  }

  _parse(value, issues, path) {
    if (value === undefined || value === null) {
      issues.push({ path, message: 'Campo requerido' })
      return undefined
    }
    const str = String(value)
    if (this.minLength && str.trim().length < this.minLength.value) {
      issues.push({ path, message: this.minLength.message })
    }
    if (this.maxLength && str.trim().length > this.maxLength.value) {
      issues.push({ path, message: this.maxLength.message })
    }
    return str
  }

  min(value, message = `Debe tener al menos ${value} caracteres`) {
    this.minLength = { value, message }
    return this
  }

  max(value, message = `Debe tener máximo ${value} caracteres`) {
    this.maxLength = { value, message }
    return this
  }
}

class ZodNumber extends ZodType {
  constructor() {
    super()
    this.minValue = null
    this.maxValue = null
  }

  _parse(value, issues, path) {
    if (value === undefined || value === null || value === '') {
      issues.push({ path, message: 'Campo requerido' })
      return undefined
    }
    const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '.'))
    if (Number.isNaN(num)) {
      issues.push({ path, message: 'Debe ser un número válido' })
      return undefined
    }
    if (this.minValue && num < this.minValue.value) {
      issues.push({ path, message: this.minValue.message })
    }
    if (this.maxValue && num > this.maxValue.value) {
      issues.push({ path, message: this.maxValue.message })
    }
    return num
  }

  min(value, message = `Debe ser mayor o igual a ${value}`) {
    this.minValue = { value, message }
    return this
  }

  max(value, message = `Debe ser menor o igual a ${value}`) {
    this.maxValue = { value, message }
    return this
  }
}

class ZodBoolean extends ZodType {
  _parse(value, issues, path) {
    if (typeof value === 'boolean') return value
    if (value === 'true') return true
    if (value === 'false') return false
    issues.push({ path, message: 'Debe ser verdadero o falso' })
    return undefined
  }
}

class ZodObject extends ZodType {
  constructor(shape) {
    super()
    this.shape = shape
  }

  _parse(value, issues, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      issues.push({ path, message: 'Debe ser un objeto' })
      return undefined
    }
    const result = {}
    for (const key of Object.keys(this.shape)) {
      const schema = this.shape[key]
      const parsed = schema._parse(value[key], issues, [...path, key])
      if (parsed !== undefined) {
        result[key] = parsed
      }
    }
    return result
  }
}

export const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  boolean: () => new ZodBoolean(),
  object: (shape) => new ZodObject(shape),
}
