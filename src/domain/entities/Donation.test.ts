import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'

describe('Donation', () => {
  const validSupporter = Supporter.make('John Doe', 'john.doe@example.com').value!
  const validAmount = Money.make(50).value!

  it('should create a donation with valid values', () => {
    const result = Donation.make(validAmount, validSupporter)
    expect(result).toBeSuccess()
  })

  it('should fail if amount is zero', () => {
    const zeroAmount = Money.make(0).value!
    const result = Donation.make(zeroAmount, validSupporter)
    expect(result).toBeFailureWithMessage('DonationMoney should be positive.')
  })

  it('should fail if amount is negative', () => {
    const negativeAmount = Money.make(-10).value!
    const result = Donation.make(negativeAmount, validSupporter)
    expect(result).toBeFailureWithMessage('DonationMoney should be positive.')
  })

  it('should fail if amount export is not a number', () => {
    const mockMoney = { export: () => 'not a number' } as unknown as Money
    const result = Donation.make(mockMoney, validSupporter)
    expect(result).toBeFailureWithMessage('Cannot import DonationMoney from invalid data format.')
  })

  it('should compare donations for equality', () => {
    const anotherSupporter = Supporter.make('Jane Doe', 'jane.doe@example.com').value!
    const d1 = Donation.make(validAmount, validSupporter).value!
    const d1b = Donation.make(validAmount, validSupporter).value!
    const d2 = Donation.make(Money.make(100).value!, validSupporter).value!
    const d3 = Donation.make(validAmount, anotherSupporter).value!

    expect(d1.isEqual(d1b)).toBe(true)
    expect(d1.isEqual(d2)).toBe(false)
    expect(d1.isEqual(d3)).toBe(false)
  })

  it('should compare donations with tiers for equality', () => {
    const tier1 = Tier.make('Silver', 10).value!
    const tier2 = Tier.make('Gold', 20).value!
    const d1 = Donation.make(validAmount, validSupporter, tier1).value!
    const d1b = Donation.make(validAmount, validSupporter, tier1).value!
    const d2 = Donation.make(validAmount, validSupporter, tier2).value!
    const d3 = Donation.make(validAmount, validSupporter, null).value!

    expect(d1.isEqual(d1b)).toBe(true)
    expect(d1.isEqual(d2)).toBe(false)
    expect(d1.isEqual(d3)).toBe(false)
  })

  it('should check if donation is eligible for tier', () => {
    const tier = Tier.make('Tier 1', 50).value!
    const dSmall = Donation.make(Money.make(40).value!, validSupporter).value!
    const dExact = Donation.make(Money.make(50).value!, validSupporter).value!
    const dLarge = Donation.make(Money.make(60).value!, validSupporter).value!

    expect(dSmall.isEligibleForTier(tier)).toBe(false)
    expect(dExact.isEligibleForTier(tier)).toBe(true)
    expect(dLarge.isEligibleForTier(tier)).toBe(true)
  })

  it('should verify if donation belongs to supporter', () => {
    const donation = Donation.make(validAmount, validSupporter).value!
    const anotherSupporter = Supporter.make('Jane Doe', 'jane.doe@example.com').value!

    expect(donation.belongsToSupporter(validSupporter)).toBe(true)
    expect(donation.belongsToSupporter(anotherSupporter)).toBe(false)
  })

  it('should add tier to bucket if tier exists', () => {
    const tier = Tier.make('Silver', 10).value!
    const donationWithTier = Donation.make(validAmount, validSupporter, tier).value!
    const donationWithoutTier = Donation.make(validAmount, validSupporter, null).value!

    const bucket1 = donationWithTier.addTierToBucket(new Set<Tier>())
    expect(bucket1.size).toBe(1)
    expect(bucket1.has(tier)).toBe(true)

    const bucket2 = donationWithoutTier.addTierToBucket(new Set<Tier>())
    expect(bucket2.size).toBe(0)
  })

  it('should add amount to total money', () => {
    const donation = Donation.make(validAmount, validSupporter).value!
    const initialTotal = Money.make(10).value!
    
    const newTotal = donation.addToTotal(initialTotal)
    expect(newTotal.isEqual(Money.make(60).value!)).toBe(true)
  })

  it('should export a predictable structure', () => {
    const donation = Donation.make(validAmount, validSupporter).value!
    expect(donation.export()).toEqual({
      amount: 50,
      supporter: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      tier: null,
    })
  })

  it('should export a predictable structure with a tier', () => {
    const tier = Tier.make('Silver', 10).value!
    const donation = Donation.make(validAmount, validSupporter, tier).value!
    expect(donation.export()).toEqual({
      amount: 50,
      supporter: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      tier: {
        name: 'Silver',
        value: 10,
      },
    })
  })

  it('should import exported data and produce an equivalent object', () => {
    const original = Donation.make(validAmount, validSupporter).value!
    const exported = original.export()

    const result = Donation.import(exported)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })

  it('should import exported data with tier and produce an equivalent object', () => {
    const tier = Tier.make('Silver', 10).value!
    const original = Donation.make(validAmount, validSupporter, tier).value!
    const exported = original.export()

    const result = Donation.import(exported)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })

  it('should fail to import corrupted data', () => {
    const result = Donation.import(null)
    expect(result).toBeFailureWithMessage('Cannot import Donation from invalid data format.')
  })

  it('should fail to import invalid amount format', () => {
    const result = Donation.import({
      amount: 'fifty',
      supporter: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    })
    expect(result).toBeFailureWithMessage('Cannot import DonationMoney from invalid data format.')
  })

  it('should fail to import invalid supporter format', () => {
    const result = Donation.import({
      amount: 50,
      supporter: null,
    })
    expect(result).toBeFailureWithMessage('Cannot import Supporter from invalid data format.')
  })

  it('should fail to import invalid tier format', () => {
    const result = Donation.import({
      amount: 50,
      supporter: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      tier: 'invalid',
    })
    expect(result).toBeFailureWithMessage('Cannot import Tier from invalid data format.')
  })

  it('should fail to import NaN amount format', () => {
    const result = Donation.import({
      amount: NaN,
      supporter: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    })
    expect(result).toBeFailureWithMessage('Money value should be an number.')
  })
})
