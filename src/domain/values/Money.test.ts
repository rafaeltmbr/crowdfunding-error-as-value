import { describe, expect, it } from 'vitest'

import { Money } from './Money'

describe('Money', () => {
  it('should create valid money', () => {
    const result = Money.make(100)
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBe(100)
  })

  it('should create zero money', () => {
    const result = Money.make(0)
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBe(0)
  })

  it('should fail if money is negative', () => {
    const result = Money.make(-1)
    expect(result).toBeFailureWithMessage('Money value should not be negative.')
  })

  it('should fail if money is NaN', () => {
    const result = Money.make(NaN)
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })

  it('should compare if one money is less than another', () => {
    const m10 = Money.make(10).value!
    const m20 = Money.make(20).value!

    expect(m10.isLessThan(m20)).toBe(true)
    expect(m20.isLessThan(m10)).toBe(false)
    expect(m10.isLessThan(m10)).toBe(false)
  })

  it('should check if two money values are equal', () => {
    const m10a = Money.make(10).value!
    const m10b = Money.make(10).value!
    const m20 = Money.make(20).value!

    expect(m10a.isEqual(m10b)).toBe(true)
    expect(m10a.isEqual(m20)).toBe(false)
  })
})
