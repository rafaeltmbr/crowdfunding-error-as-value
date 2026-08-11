import { Tier } from '@entities/Tier'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'
import { Name } from '@values/Name'

describe('Tier', () => {
  describe('make', () => {
    it('should create a valid tier', () => {
      const result = Tier.make(Name.make('Silver Tier').value!, Money.make(100).value!)
      expect(result).toBeSuccess()
    })

    it('should fail if name is less than 3 characters', () => {
      const result = Tier.make(Name.make('Ab').value!, Money.make(100).value!)
      expect(result).toBeFailureWithCode('TIER_NAME_MIN_LENGTH')
    })

    it('should fail if value is zero', () => {
      const result = Tier.make(Name.make('Valid Name').value!, Money.make(0).value!)
      expect(result).toBeFailureWithCode('TIER_MONEY_NON_POSITIVE')
    })
  })

  describe('isValueLessThan', () => {
    it('should return true if value is less than', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t2 = Tier.make(Name.make('Tier 2').value!, Money.make(20).value!).value!
      expect(t1.isValueLessThan(t2)).toBe(true)
    })

    it('should return false if value is greater or equal', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(20).value!).value!
      const t2 = Tier.make(Name.make('Tier 2').value!, Money.make(10).value!).value!
      expect(t1.isValueLessThan(t2)).toBe(false)
    })
  })

  describe('hasId', () => {
    it('should return true if id matches', () => {
      const tier = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const id = Id.fromSnapshot(tier.toSnapshot().id).value!
      expect(tier.hasId(id)).toBe(true)
    })

    it('should return false if id does not match', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t2 = Tier.make(Name.make('Tier 2').value!, Money.make(20).value!).value!
      const t2Id = Id.fromSnapshot(t2.toSnapshot().id).value!
      expect(t1.hasId(t2Id)).toBe(false)
    })
  })

  describe('isValueEqual', () => {
    it('should return true if tier values are equal', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t1b = Tier.make(Name.make('Tier 1 Alt').value!, Money.make(10).value!).value!
      expect(t1.isValueEqual(t1b)).toBe(true)
    })

    it('should return false if tier values are not equal', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t2 = Tier.make(Name.make('Tier 2').value!, Money.make(20).value!).value!
      expect(t1.isValueEqual(t2)).toBe(false)
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      expect(t1.isEqual(t1)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t1Clone = Tier.fromSnapshot(t1.toSnapshot()).value!
      expect(t1.isEqual(t1Clone)).toBe(true)
    })

    it('should verify inequality with different instances same data', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t1b = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      expect(t1.isEqual(t1b)).toBe(false)
    })

    it('should verify inequality with different data', () => {
      const t1 = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const t2 = Tier.make(Name.make('Tier 2').value!, Money.make(10).value!).value!
      expect(t1.isEqual(t2)).toBe(false)
    })
  })

  describe('isValueEligible', () => {
    it('should return true if money is exactly the tier value', () => {
      const tier = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      expect(tier.isValueEligible(Money.make(10).value!)).toBe(true)
    })

    it('should return true if money is greater than the tier value', () => {
      const tier = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      expect(tier.isValueEligible(Money.make(11).value!)).toBe(true)
    })

    it('should return false if money is less than the tier value', () => {
      const tier = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      expect(tier.isValueEligible(Money.make(9).value!)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should toSnapshot a predictable structure', () => {
      const original = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!
      const data = original.toSnapshot()
      expect(data).toEqual({ id: original.toSnapshot().id, name: 'Tier 1', value: 10 })
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
      const original = Tier.make(Name.make('Tier 1').value!, Money.make(10).value!).value!

      const result = Tier.fromSnapshot(original.toSnapshot())
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should fail to fromSnapshot invalid name format', () => {
      const result = Tier.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'A',
        value: 100,
      })
      expect(result).toBeFailureWithCode('TIER_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot empty name', () => {
      const result = Tier.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: '',
        value: 100,
      })
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })

    it('should fail to fromSnapshot invalid id format', () => {
      const result = Tier.fromSnapshot({ id: 'SHORT', name: 'Tier 1', value: 10 })
      expect(result).toBeFailureWithCode('ID_INVALID_LENGTH')
    })

    it('should fail to fromSnapshot if value is negative', () => {
      const result = Tier.fromSnapshot({ id: 'A2CDEFGHJK', name: 'Tier 1', value: -10 })
      expect(result).toBeFailureWithCode('TIER_MONEY_NON_POSITIVE')
    })

    it('should fail to fromSnapshot if value is zero', () => {
      const result = Tier.fromSnapshot({ id: 'A2CDEFGHJK', name: 'Tier 1', value: 0 })
      expect(result).toBeFailureWithCode('TIER_MONEY_NON_POSITIVE')
    })

    it('should fail to fromSnapshot if value is NaN', () => {
      const result = Tier.fromSnapshot({ id: 'A2CDEFGHJK', name: 'Tier 1', value: NaN })
      expect(result).toBeFailureWithCode('MONEY_INVALID_VALUE')
    })
  })
})

describe('TierName', () => {
  describe('make', () => {
    it('should fail with TIER_NAME_INVALID_FACTORY_METHOD', () => {
      const tier = Tier.make(Name.make('Valid Name').value!, Money.make(10).value!).value!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TierNameClass = (tier as any).name.constructor
      const result = TierNameClass.make('test')
      expect(result).toBeFailureWithCode('TIER_NAME_INVALID_FACTORY_METHOD')
    })
  })
})

describe('TierMoney', () => {
  describe('make', () => {
    it('should fail with TIER_MONEY_INVALID_FACTORY_METHOD', () => {
      const tier = Tier.make(Name.make('Valid Name').value!, Money.make(10).value!).value!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TierMoneyClass = (tier as any).value.constructor
      const result = TierMoneyClass.make(10)
      expect(result).toBeFailureWithCode('TIER_MONEY_INVALID_FACTORY_METHOD')
    })
  })
})
