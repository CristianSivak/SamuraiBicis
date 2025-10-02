import test from 'node:test'
import assert from 'node:assert/strict'
import { customerTypeFormSchema } from '../src/modules/admin/customer-types/schema/customerType.schema.js'

const validData = {
  nombre: 'Mayorista',
  descripcion: 'Clientes con beneficio',
  descuentoPorcentaje: 15,
  activo: true,
}

test('customerTypeFormSchema accepts valid data', () => {
  const result = customerTypeFormSchema.safeParse(validData)
  assert.equal(result.success, true)
  assert.deepEqual(result.data, validData)
})

test('customerTypeFormSchema rejects invalid discount', () => {
  const result = customerTypeFormSchema.safeParse({ ...validData, descuentoPorcentaje: 150 })
  assert.equal(result.success, false)
})

test('customerTypeFormSchema enforces nombre length', () => {
  const result = customerTypeFormSchema.safeParse({ ...validData, nombre: 'A' })
  assert.equal(result.success, false)
})
