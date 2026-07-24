import { Money } from '@values/Money'
import { describe, expect, it } from 'vitest'

import { Campaign } from './Campaign'
import { Donation } from './Donation'
import { Supporter } from './Supporter'
import { Tier } from './Tier'

describe('Campaign', () => {
  const tier10 = Tier.make('Tier 10', 10).value!
  const tier20 = Tier.make('Tier 20', 20).value!
  const supporter1 = Supporter.make('Supporter 1', 'supporter1@example.com').value!
  const supporter2 = Supporter.make('Supporter 2', 'supporter2@example.com').value!

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

  it('should compare campaigns for equality', () => {
    const c1 = Campaign.make('Campaign 1', [tier10]).value!
    const c1b = Campaign.make('Campaign 1', [tier10]).value!
    const c2 = Campaign.make('Campaign 2', [tier10]).value!
    const c3 = Campaign.make('Campaign 1', [tier20]).value!
    const c4 = Campaign.make('Campaign 1', [tier10, tier20]).value!

    expect(c1.isEqual(c1b)).toBe(true)
    expect(c1.isEqual(c2)).toBe(false)
    expect(c1.isEqual(c3)).toBe(false)
    expect(c1.isEqual(c4)).toBe(false)
  })

  it('should export a predictable structure', () => {
    const campaign = Campaign.make('My Campaign', [tier10]).value!
    expect(campaign.export()).toEqual({
      name: 'My Campaign',
      tiers: [{ name: 'Tier 10', value: 10 }],
    })
  })

  it('should import an exported data and produce an equivalent object', () => {
    const original = Campaign.make('My Campaign', [tier10, tier20]).value!
    const exported = original.export()

    const result = Campaign.import(exported)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })

  it('should fail to import corrupted data', () => {
    const result = Campaign.import(null)
    expect(result).toBeFailureWithMessage('Cannot import Campaign from invalid data format.')
  })

  it('should fail to import invalid name', () => {
    const result = Campaign.import({ name: 123, tiers: [] })
    expect(result).toBeFailureWithMessage('Cannot import CampaignName from invalid data format.')
  })

  it('should fail to import invalid tiers format', () => {
    const result = Campaign.import({ name: 'Valid Name', tiers: {} })
    expect(result).toBeFailureWithMessage('Cannot import Tiers from invalid data format.')
  })

  it('should fail to import invalid tier data', () => {
    const result = Campaign.import({
      name: 'Valid Name',
      tiers: [{ name: 'Tier 1', value: 'invalid' }],
    })
    expect(result).toBeFailureWithMessage('Cannot import TierMoney from invalid data format.')
  })

  it('should fail to import if campaign name is too short', () => {
    const result = Campaign.import({ name: 'Ca', tiers: [] })
    expect(result).toBeFailureWithMessage('Campaign name should be at least 3 characters long.')
  })

  it('should fail to import if tiers have duplicate values', () => {
    const result = Campaign.import({
      name: 'My Campaign',
      tiers: [tier10.export(), { name: 'Another Tier 10', value: 10 }],
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
