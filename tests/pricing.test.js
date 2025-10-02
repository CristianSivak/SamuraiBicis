import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDiscountedPrice } from '../src/modules/products/utils/pricing.js'

test('calculateDiscountedPrice applies percentage correctly', () => {
  assert.equal(calculateDiscountedPrice(100, 10), 90)
  assert.equal(calculateDiscountedPrice(200, 25), 150)
})

test('calculateDiscountedPrice clamps to two decimals', () => {
  assert.equal(calculateDiscountedPrice(99.99, 15), 84.99)
})

test('calculateDiscountedPrice handles invalid discount as zero', () => {
  assert.equal(calculateDiscountedPrice(50, NaN), 50)
})
