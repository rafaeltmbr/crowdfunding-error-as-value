import { Money } from '@values/Money'
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
    expect(result).toBeFailureWithMessage('TierName should be at least 3 characters long.')
  })

  it('should fail if name is empty', () => {
    const result = Tier.make('', 100)
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if value is NaN', () => {
    const result = Tier.make('Valid Name', NaN)
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })

  it('should fail if value is zero', () => {
    const result = Tier.make('Valid Name', 0)
    expect(result).toBeFailureWithMessage('TierMoney should be positive.')
  })

  it('should fail if value is negative', () => {
    const result = Tier.make('Valid Name', -10)
    expect(result).toBeFailureWithMessage('TierMoney should be positive.')
  })

  it('should compare tier values', () => {
    const t1 = Tier.make('Tier 1', 10).value!
    const t2 = Tier.make('Tier 2', 20).value!

    expect(t1.isValueLessThan(t2)).toBe(true)
    expect(t1.isValueEqual(t2)).toBe(false)

    const t1b = Tier.make('Tier 1 Alt', 10).value!
    expect(t1.isValueEqual(t1b)).toBe(true)
  })

  it('should compare tiers for equality', () => {
    const t1 = Tier.make('Tier 1', 10).value!
    const t1b = Tier.make('Tier 1', 10).value!
    const t2 = Tier.make('Tier 2', 10).value!
    const t3 = Tier.make('Tier 1', 20).value!

    expect(t1.isEqual(t1b)).toBe(true)
    expect(t1.isEqual(t2)).toBe(false)
    expect(t1.isEqual(t3)).toBe(false)
  })

  it('should verify if money is eligible for tier', () => {
    const tier = Tier.make('Tier 1', 10).value!
    expect(tier.isValueEligible(Money.make(9).value!)).toBe(false)
    expect(tier.isValueEligible(Money.make(10).value!)).toBe(true)
    expect(tier.isValueEligible(Money.make(11).value!)).toBe(true)
  })

  it('should export a predictable structure', () => {
    const data = Tier.make('Tier 1', 10).value!.export()
    expect(data).toEqual({ name: 'Tier 1', value: 10 })
  })

  it('should import an exported data and produce an equivalent object', () => {
    const original = Tier.make('Tier 1', 10).value!

    const result = Tier.import(original.export())
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(result.value!)).toBe(true)
  })

  it('should fail to import corrupted data', () => {
    const result = Tier.import(null)
    expect(result).toBeFailureWithMessage('Cannot import Tier from invalid data format.')
  })

  it('should fail to import invalid name', () => {
    const result = Tier.import({ name: 1, value: 10 })
    expect(result).toBeFailureWithMessage('Cannot import TierName from invalid data format.')
  })

  it('should fail to import invalid value', () => {
    const result = Tier.import({ name: 'Tier 1', value: '1' })
    expect(result).toBeFailureWithMessage('Cannot import TierMoney from invalid data format.')
  })

  it('should fail to import if name is too short', () => {
    const result = Tier.import({ name: 'Ab', value: 10 })
    expect(result).toBeFailureWithMessage('TierName should be at least 3 characters long.')
  })

  it('should fail to import if value is negative', () => {
    const result = Tier.import({ name: 'Tier 1', value: -10 })
    expect(result).toBeFailureWithMessage('TierMoney should be positive.')
  })

  it('should fail to import if value is zero', () => {
    const result = Tier.import({ name: 'Tier 1', value: 0 })
    expect(result).toBeFailureWithMessage('TierMoney should be positive.')
  })

  it('should fail to import if value is NaN', () => {
    const result = Tier.import({ name: 'Tier 1', value: NaN })
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })
})
