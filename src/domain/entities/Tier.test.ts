import { describe, expect, it } from 'vitest'

import { Tier } from './Tier'

describe('Tier', () => {
  it('should create a valid tier', () => {
    const result = Tier.make('Silver Tier', 100)
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBeDefined()
  })

  it('should fail if name is less than 3 characters', () => {
    const result = Tier.make('Ab', 100)
    expect(result).toBeFailureWithMessage('Tier name should be at least 3 characters long.')
  })

  it('should fail if name is empty', () => {
    const result = Tier.make('', 100)
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if value is not positive', () => {
    const result = Tier.make('Valid Name', 0)
    expect(result).toBeFailureWithMessage('Tier value should be positive.')

    const resultNegative = Tier.make('Valid Name', -10)
    expect(resultNegative).toBeFailureWithMessage('Money value should not be negative.')
  })

  it('should compare tier values', () => {
    const t1 = Tier.make('Tier 1', 10).value!
    const t2 = Tier.make('Tier 2', 20).value!

    expect(t1.isValueLessThan(t2)).toBe(true)
    expect(t1.isValueEqual(t2)).toBe(false)

    const t1b = Tier.make('Tier 1 Alt', 10).value!
    expect(t1.isValueEqual(t1b)).toBe(true)
  })
})
