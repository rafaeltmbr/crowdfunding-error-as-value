import { describe, expect, it } from 'vitest'

import { Money } from '@values/Money'

describe('Money', () => {
  it('should create valid money', () => {
    const result = Money.make(100)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(Money.make(100).value!)).toBe(true)
  })

  it('should create zero money', () => {
    const result = Money.make(0)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(Money.make(0).value!)).toBe(true)
  })

  it('should verify export returns data', () => {
    const result = Money.make(100)
    expect(result.value!.export()).toBeDefined()
  })

  it('should fail if money is NaN', () => {
    const result = Money.make(NaN)
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })

  it('should fail if money is Infinity', () => {
    const result = Money.make(Infinity)
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })

  it('should fail if money is -Infinity', () => {
    const result = Money.make(-Infinity)
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

  it('should add two money values together', () => {
    const m10 = Money.make(10).value!
    const m20 = Money.make(20).value!
    const sum = m10.plus(m20)

    expect(sum.isEqual(Money.make(30).value!)).toBe(true)
  })

  it('should import an exported data and produce an equivalent object', () => {
    const original = Money.make(1234.5).value!

    const result = Money.import(original.export())
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })
})
