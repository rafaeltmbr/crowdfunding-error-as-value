import { describe, expect, it } from 'vitest'

import { Campaign } from './Campaign'
import { Tier } from './Tier'

describe('Campaign', () => {
  const validTier1 = Tier.make('Tier 1', 10).value!
  const validTier2 = Tier.make('Tier 2', 20).value!

  it('should create a valid campaign with no tiers', () => {
    const result = Campaign.make('My Campaign')
    expect(result).toBeSuccess()
    expect(result.value!.export()).toEqual({
      name: 'My Campaign',
      tiers: [],
    })
  })

  it('should create a valid campaign with tiers', () => {
    const result = Campaign.make('My Campaign', [validTier2, validTier1])
    expect(result).toBeSuccess()
    // Tiers should be sorted by value
    expect(result.value!.export()).toEqual({
      name: 'My Campaign',
      tiers: [validTier1.export(), validTier2.export()],
    })
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
    expect(result.value).toBe(1) // Length of tiers
    expect(campaign.export()).toEqual({
      name: 'My Campaign',
      tiers: [validTier1.export()],
    })
  })

  it('should fail to add a duplicate tier value', () => {
    const campaign = Campaign.make('My Campaign', [validTier1]).value!
    const duplicateTier = Tier.make('Duplicate', 10).value!
    const result = campaign.addTier(duplicateTier)

    expect(result).toBeFailureWithMessage('Tiers values should be unique.')
  })
})
