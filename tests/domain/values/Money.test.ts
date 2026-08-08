import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'

describe('Money', () => {
  describe('make', () => {
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
  })

  describe('isLessThan', () => {
    it('should return true if one money is less than another', () => {
      const m10 = Money.make(10).value!
      const m20 = Money.make(20).value!
      expect(m10.isLessThan(m20)).toBe(true)
    })

    it('should return false if one money is greater than another', () => {
      const m10 = Money.make(10).value!
      const m20 = Money.make(20).value!
      expect(m20.isLessThan(m10)).toBe(false)
    })

    it('should return false if one money is equal to itself', () => {
      const m10 = Money.make(10).value!
      expect(m10.isLessThan(m10)).toBe(false)
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const m10 = Money.make(10).value!
      expect(m10.isEqual(m10)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const m10a = Money.make(10).value!
      const m10b = Money.make(10).value!
      expect(m10a.isEqual(m10b)).toBe(true)
    })

    it('should verify inequality', () => {
      const m10a = Money.make(10).value!
      const m20 = Money.make(20).value!
      expect(m10a.isEqual(m20)).toBe(false)
    })
  })

  describe('plus', () => {
    it('should add two money values together', () => {
      const m10 = Money.make(10).value!
      const m20 = Money.make(20).value!
      const sum = m10.plus(m20)

      expect(sum.isEqual(Money.make(30).value!)).toBe(true)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returns the correct exact value', () => {
      const result = Money.make(100)
      expect(result.value!.toSnapshot()).toEqual(100)
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
      const original = Money.make(1234.5).value!

      const result = Money.fromSnapshot(original.toSnapshot())
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })
  })
})
