import { describe, expect, it } from 'vitest'

import { Campaign } from './Campaign'
import { Tier } from './Tier'

describe('Campaign', () => {
  const validTier1 = Tier.make('Tier 1', 10).value!
  const validTier2 = Tier.make('Tier 2', 20).value!

  it('should create a valid campaign with no tiers', () => {
    const result = Campaign.make('My Campaign')
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBeDefined()
  })

  it('should create a valid campaign with tiers', () => {
    const result = Campaign.make('My Campaign', [validTier2, validTier1])
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
    const duplicateTier = Tier.make('Another Tier 1', 10).value!
    const result = Campaign.make('My Campaign', [validTier1, duplicateTier])
    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })

  it('should add a tier successfully', () => {
    const campaign = Campaign.make('My Campaign').value!
    const result = campaign.addTier(validTier1)

    expect(result).toBeSuccess()
  })

  it('should fail to add a duplicate tier value', () => {
    const campaign = Campaign.make('My Campaign', [validTier1]).value!
    const duplicateTier = Tier.make('Duplicate', 10).value!
    const result = campaign.addTier(duplicateTier)

    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })

  it('should compare campaigns for equality', () => {
    const c1 = Campaign.make('Campaign 1', [validTier1]).value!
    const c1b = Campaign.make('Campaign 1', [validTier1]).value!
    const c2 = Campaign.make('Campaign 2', [validTier1]).value!
    const c3 = Campaign.make('Campaign 1', [validTier2]).value!
    const c4 = Campaign.make('Campaign 1', [validTier1, validTier2]).value!

    expect(c1.isEqual(c1b)).toBe(true)
    expect(c1.isEqual(c2)).toBe(false)
    expect(c1.isEqual(c3)).toBe(false)
    expect(c1.isEqual(c4)).toBe(false)
  })

  it('should export a predictable structure', () => {
    const campaign = Campaign.make('My Campaign', [validTier1]).value!
    expect(campaign.export()).toEqual({
      name: 'My Campaign',
      tiers: [{ name: 'Tier 1', value: 10 }],
    })
  })

  it('should import an exported data and produce an equivalent object', () => {
    const original = Campaign.make('My Campaign', [validTier1, validTier2]).value!
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
      tiers: [
        { name: 'Tier 1', value: 10 },
        { name: 'Another Tier 1', value: 10 },
      ],
    })
    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })
})
