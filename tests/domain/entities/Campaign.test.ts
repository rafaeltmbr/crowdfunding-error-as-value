import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'

import { Campaign } from '@entities/Campaign'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'

describe('Campaign', () => {
  const tier10 = Tier.make('Tier 10', 10).value!
  const tier20 = Tier.make('Tier 20', 20).value!
  const supporter1 = Supporter.make('Supporter 1', 'supporter1@example.com').value!

  it('should create a valid campaign with no tiers', () => {
    const result = Campaign.make('My Campaign')
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBeDefined()
  })

  it('should create a valid campaign with tiers', () => {
    const result = Campaign.make('My Campaign', [tier20, tier10])
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBeDefined()
  })

  it('should fail if campaign name is less than 3 characters', () => {
    const result = Campaign.make('Ca')
    expect(result).toBeFailureWithMessage('Campaign name should be at least 3 characters long.')
  })

  it('should fail if campaign name is empty', () => {
    const result = Campaign.make('')
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if tiers have duplicate values', () => {
    const duplicateTier = Tier.make('Another Tier 10', 10).value!
    const result = Campaign.make('My Campaign', [tier10, duplicateTier])
    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })

  it('should add a tier successfully', () => {
    const campaign = Campaign.make('My Campaign').value!
    const result = campaign.addTier(tier10)

    expect(result).toBeSuccess()
  })

  it('should fail to add a duplicate tier value', () => {
    const campaign = Campaign.make('My Campaign', [tier10]).value!
    const duplicateTier = Tier.make('Another Tier 10', 10).value!
    const result = campaign.addTier(duplicateTier)

    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })

  it('should compare campaigns for equality by ID', () => {
    const c1 = Campaign.make('Campaign 1', [tier10]).value!
    const c1b = Campaign.import(c1.export()).value!
    const c2 = Campaign.make('Campaign 2', [tier10]).value!

    expect(c1.isEqual(c1b)).toBe(true)
    expect(c1.isEqual(c2)).toBe(false)
  })

  it('should export a predictable structure', () => {
    const campaign = Campaign.make('My Campaign', [tier10]).value!
    const exported = campaign.export() as any
    expect(exported.name).toEqual('My Campaign')
    expect(exported.funding.tiers).toEqual([
      { id: campaign.export().funding.tiers[0]!.id, name: 'Tier 10', value: 10 },
    ])
    expect(exported.funding.donations).toEqual([])
    expect(exported.id).toBeDefined()
  })

  it('should import an exported data and produce an equivalent object', () => {
    const original = Campaign.make('My Campaign', [tier10, tier20]).value!
    original.makeDonation(Money.make(10).value!, supporter1)
    const exported = original.export()

    const result = Campaign.import(exported)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
    const stats = result.value!.supporterDonationStats(supporter1)
    const tiersArray = Array.from(stats.tiers)
    expect(tiersArray.length).toBe(1)
    expect(tiersArray[0]!.isEqual(tier10)).toBe(true)
  })

  it('should fail to import invalid id format', () => {
    const result = Campaign.import({
      id: 'SHORT',
      name: 'Valid Name',
      funding: { tiers: [], donations: [] },
    })
    expect(result).toBeFailureWithMessage('Id length should be 10 characters long.')
  })

  it('should fail to import invalid name format', () => {
    const result = Campaign.import({
      id: 'A2CDEFGHJK',
      name: 'Ab',
      funding: { tiers: [], donations: [] },
    })
    expect(result).toBeFailureWithMessage('Campaign name should be at least 3 characters long.')
  })

  it('should fail to import with invalid tier inside funding', () => {
    const result = Campaign.import({
      id: 'A2CDEFGHJK',
      name: 'Valid Name',
      funding: { tiers: [{ id: 'A2CDEFGHJK', name: 'A', value: 10 }], donations: [] },
    })
    expect(result).toBeFailureWithMessage('TierName should be at least 3 characters long.')
  })

  it('should fail to import with invalid donation inside funding', () => {
    const result = Campaign.import({
      id: 'A2CDEFGHJK',
      name: 'Valid Name',
      funding: {
        tiers: [],
        donations: [{ id: 'A2CDEFGHJK', amount: -50, supporter: supporter1.export(), tier: null }],
      },
    })
    expect(result).toBeFailureWithMessage('DonationMoney should be positive.')
  })

  it('should fail to import if campaign name is too short', () => {
    const result = Campaign.import({
      id: 'A2CDEFGHJK',
      name: 'Ca',
      funding: { tiers: [], donations: [] },
    })
    expect(result).toBeFailureWithMessage('Campaign name should be at least 3 characters long.')
  })

  it('should fail to import if tiers have duplicate values', () => {
    const result = Campaign.import({
      id: 'A2CDEFGHJK',
      name: 'My Campaign',
      funding: {
        tiers: [tier10.export(), { id: 'A2CDEFGHJK', name: 'Another Tier 10', value: 10 }],
        donations: [],
      },
    })
    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })

  it('should fail to accept a donation with invalid (negative) amount', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
    const result = campaign.makeDonation(Money.make(-5).value!, supporter1)
    expect(result).toBeFailureWithMessage('DonationMoney should be positive.')
  })

  it('should accept a donation with unsufficient amount and return no tier', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
    const result = campaign.makeDonation(Money.make(9).value!, supporter1)
    expect(result).toBeSuccess()
    const stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.size).toBe(0)
  })

  it('should accept a donation with sufficient amount and return the matching tier', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
    const result = campaign.makeDonation(Money.make(10).value!, supporter1)
    expect(result).toBeSuccess()
    const stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier10)).toBe(true)
  })

  it('should accept a donation and return the largest matching tier', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

    const result1 = campaign.makeDonation(Money.make(20).value!, supporter1)
    expect(result1).toBeSuccess()
    let stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier20)).toBe(true)

    const result2 = campaign.makeDonation(Money.make(25).value!, supporter1)
    expect(result2).toBeSuccess()
    stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier20)).toBe(true)
  })

  it('should accept multiple donations of the same amount', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

    const result1 = campaign.makeDonation(Money.make(10).value!, supporter1)
    expect(result1).toBeSuccess()
    let stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier10)).toBe(true)

    const result2 = campaign.makeDonation(Money.make(10).value!, supporter1)
    expect(result2).toBeSuccess()
    stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier10)).toBe(true)
    expect(stats.total.export()).toBe(20)
  })

  it('should accept multiple donations of different amounts', () => {
    const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

    const result1 = campaign.makeDonation(Money.make(10).value!, supporter1)
    expect(result1).toBeSuccess()
    let stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier10)).toBe(true)

    const result2 = campaign.makeDonation(Money.make(20).value!, supporter1)
    expect(result2).toBeSuccess()
    stats = campaign.supporterDonationStats(supporter1)
    expect(stats.tiers.has(tier20)).toBe(true)
    expect(stats.total.export()).toBe(30)
  })
})
