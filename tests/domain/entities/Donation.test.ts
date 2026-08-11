import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'

describe('Donation', () => {
  const validSupporter = Supporter.make('John Doe', 'john.doe@example.com').value!
  const validAmount = Money.make(50).value!

  describe('make', () => {
    it('should create a donation with valid values', () => {
      const result = Donation.make(validAmount, validSupporter.id)
      expect(result).toBeSuccess()
    })

    it('should expose an id getter', () => {
      const result = Donation.make(validAmount, validSupporter.id)
      expect(result.value!.id).toBeDefined()
    })

    it('should fail if amount is zero', () => {
      const zeroAmount = Money.make(0).value!
      const result = Donation.make(zeroAmount, validSupporter.id)
      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })

    it('should fail if amount is negative', () => {
      const negativeAmount = Money.make(-10).value!
      const result = Donation.make(negativeAmount, validSupporter.id)
      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      expect(d1.isEqual(d1)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      const d1b = Donation.fromSnapshot(d1.toSnapshot()).value!
      expect(d1.isEqual(d1b)).toBe(true)
    })

    it('should verify inequality with different instances', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      const d1b = Donation.make(validAmount, validSupporter.id).value!
      expect(d1.isEqual(d1b)).toBe(false)
    })

    it('should verify inequality with different amounts', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      const d2 = Donation.make(Money.make(100).value!, validSupporter.id).value!
      expect(d1.isEqual(d2)).toBe(false)
    })

    it('should verify inequality with different supporters', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      const anotherSupporter = Supporter.make('Jane Doe', 'jane.doe@example.com').value!
      const d3 = Donation.make(validAmount, anotherSupporter.id).value!
      expect(d1.isEqual(d3)).toBe(false)
    })

    it('should verify self-equality with tier', () => {
      const tier1 = Tier.make('Silver', 10).value!
      const d1 = Donation.make(validAmount, validSupporter.id, tier1).value!
      expect(d1.isEqual(d1)).toBe(true)
    })

    it('should verify inequality with different instances with tier', () => {
      const tier1 = Tier.make('Silver', 10).value!
      const d1 = Donation.make(validAmount, validSupporter.id, tier1).value!
      const d1b = Donation.make(validAmount, validSupporter.id, tier1).value!
      expect(d1.isEqual(d1b)).toBe(false)
    })

    it('should verify inequality with different tiers', () => {
      const tier1 = Tier.make('Silver', 10).value!
      const tier2 = Tier.make('Gold', 20).value!
      const d1 = Donation.make(validAmount, validSupporter.id, tier1).value!
      const d2 = Donation.make(validAmount, validSupporter.id, tier2).value!
      expect(d1.isEqual(d2)).toBe(false)
    })

    it('should verify inequality when one has no tier', () => {
      const tier1 = Tier.make('Silver', 10).value!
      const d1 = Donation.make(validAmount, validSupporter.id, tier1).value!
      const d3 = Donation.make(validAmount, validSupporter.id, null).value!
      expect(d1.isEqual(d3)).toBe(false)
    })
  })

  describe('isEligibleForTier', () => {
    it('should return false if donation is less than tier', () => {
      const tier = Tier.make('Tier 1', 50).value!
      const dSmall = Donation.make(Money.make(40).value!, validSupporter.id).value!
      expect(dSmall.isEligibleForTier(tier)).toBe(false)
    })

    it('should return true if donation is exact tier amount', () => {
      const tier = Tier.make('Tier 1', 50).value!
      const dExact = Donation.make(Money.make(50).value!, validSupporter.id).value!
      expect(dExact.isEligibleForTier(tier)).toBe(true)
    })

    it('should return true if donation is greater than tier amount', () => {
      const tier = Tier.make('Tier 1', 50).value!
      const dLarge = Donation.make(Money.make(60).value!, validSupporter.id).value!
      expect(dLarge.isEligibleForTier(tier)).toBe(true)
    })
  })

  describe('hasId', () => {
    it('should return true if id matches', () => {
      const donation = Donation.make(validAmount, validSupporter.id).value!
      expect(donation.hasId(donation.id)).toBe(true)
    })
    it('should return false if id does not match', () => {
      const d1 = Donation.make(validAmount, validSupporter.id).value!
      const d2 = Donation.make(validAmount, validSupporter.id).value!
      expect(d1.hasId(d2.id)).toBe(false)
    })
  })

  describe('belongsToSupporterId', () => {
    it('should return true if donation belongs to supporter', () => {
      const donation = Donation.make(validAmount, validSupporter.id).value!
      expect(donation.belongsToSupporterId(validSupporter.id)).toBe(true)
    })

    it('should return false if donation belongs to another supporter', () => {
      const donation = Donation.make(validAmount, validSupporter.id).value!
      const anotherSupporter = Supporter.make('Jane Doe', 'jane.doe@example.com').value!
      expect(donation.belongsToSupporterId(anotherSupporter.id)).toBe(false)
    })
  })

  describe('addTierToBucket', () => {
    it('should add tier to bucket if tier exists', () => {
      const tier = Tier.make('Silver', 10).value!
      const donationWithTier = Donation.make(validAmount, validSupporter.id, tier).value!
      const bucket = donationWithTier.addTierToBucket(new Set<Tier>())
      expect(bucket.size).toBe(1)
      expect(bucket.has(tier)).toBe(true)
    })

    it('should not add tier to bucket if tier is null', () => {
      const donationWithoutTier = Donation.make(validAmount, validSupporter.id, null).value!
      const bucket = donationWithoutTier.addTierToBucket(new Set<Tier>())
      expect(bucket.size).toBe(0)
    })
  })

  describe('addToTotal', () => {
    it('should add amount to total money', () => {
      const donation = Donation.make(validAmount, validSupporter.id).value!
      const initialTotal = Money.make(10).value!

      const newTotal = donation.addToTotal(initialTotal)
      expect(newTotal.isEqual(Money.make(60).value!)).toBe(true)
    })
  })

  describe('toSnapshot', () => {
    it('should toSnapshot a predictable structure', () => {
      const donation = Donation.make(validAmount, validSupporter.id).value!
      expect(donation.toSnapshot()).toEqual({
        id: donation.toSnapshot().id,
        amount: 50,
        supporterId: validSupporter.id.toSnapshot(),
        tier: null,
      })
    })

    it('should toSnapshot a predictable structure with a tier', () => {
      const tier = Tier.make('Silver', 10).value!
      const donation = Donation.make(validAmount, validSupporter.id, tier).value!
      expect(donation.toSnapshot()).toEqual({
        id: donation.toSnapshot().id,
        amount: 50,
        supporterId: validSupporter.id.toSnapshot(),
        tier: tier.toSnapshot(),
      })
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot snapshot data and produce an equivalent object', () => {
      const original = Donation.make(validAmount, validSupporter.id).value!
      const snapshot = original.toSnapshot()

      const result = Donation.fromSnapshot(snapshot)
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should fromSnapshot snapshot data with tier and produce an equivalent object', () => {
      const tier = Tier.make('Silver', 10).value!
      const original = Donation.make(validAmount, validSupporter.id, tier).value!
      const snapshot = original.toSnapshot()

      const result = Donation.fromSnapshot(snapshot)
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should fail to fromSnapshot invalid supporterId format', () => {
      const result = Donation.fromSnapshot({
        id: 'A2CDEFGHJK',
        amount: 50,
        supporterId: 'SHORT',
        tier: null,
      })
      expect(result).toBeFailureWithCode('ID_INVALID_LENGTH')
    })

    it('should fail to fromSnapshot invalid id format', () => {
      const result = Donation.fromSnapshot({
        id: 'SHORT',
        amount: 50,
        supporterId: validSupporter.id.toSnapshot(),
        tier: null,
      })
      expect(result).toBeFailureWithCode('ID_INVALID_LENGTH')
    })

    it('should fail to fromSnapshot invalid tier format', () => {
      const result = Donation.fromSnapshot({
        id: 'A2CDEFGHJK',
        amount: 50,
        supporterId: validSupporter.id.toSnapshot(),
        tier: { id: 'A2CDEFGHJK', name: 'A', value: 10 },
      })
      expect(result).toBeFailureWithCode('TIER_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot NaN amount format', () => {
      const result = Donation.fromSnapshot({
        id: 'A2CDEFGHJK',
        amount: NaN,
        supporterId: validSupporter.id.toSnapshot(),
        tier: null,
      })
      expect(result).toBeFailureWithCode('MONEY_INVALID_VALUE')
    })
  })
})
