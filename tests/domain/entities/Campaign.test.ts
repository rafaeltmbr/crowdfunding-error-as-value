import { Campaign } from '@entities/Campaign'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { describe, expect, it } from 'vitest'

describe('Campaign', () => {
  const tier10 = Tier.make('Tier 10', 10).value!
  const tier20 = Tier.make('Tier 20', 20).value!
  const supporter1 = Supporter.make('Supporter 1', 'supporter1@example.com').value!

  describe('make', () => {
    it('should create a valid campaign with no tiers', () => {
      const result = Campaign.make('My Campaign')
      expect(result).toBeSuccess()
    })

    it('should expose an id getter', () => {
      const result = Campaign.make('My Campaign')
      expect(result.value!.id).toBeDefined()
    })

    it('should create a valid campaign with tiers', () => {
      const result = Campaign.make('My Campaign', [tier20, tier10])
      expect(result).toBeSuccess()
    })

    it('should fail if campaign name is less than 3 characters', () => {
      const result = Campaign.make('Ca')
      expect(result).toBeFailureWithCode('CAMPAIGN_NAME_MIN_LENGTH')
    })

    it('should fail if campaign name is empty', () => {
      const result = Campaign.make('')
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })

    it('should fail if tiers have duplicate values', () => {
      const duplicateTier = Tier.make('Another Tier 10', 10).value!
      const result = Campaign.make('My Campaign', [tier10, duplicateTier])
      expect(result).toBeFailureWithCode('TIER_VALUE_DUPLICATE')
    })
  })

  describe('addTier', () => {
    it('should add a tier successfully', () => {
      const campaign = Campaign.make('My Campaign').value!
      const result = campaign.addTier(tier10)

      expect(result).toBeSuccess()
    })

    it('should fail to add a duplicate tier value', () => {
      const campaign = Campaign.make('My Campaign', [tier10]).value!
      const duplicateTier = Tier.make('Another Tier 10', 10).value!
      const result = campaign.addTier(duplicateTier)

      expect(result).toBeFailureWithCode('TIER_VALUE_DUPLICATE')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const c1 = Campaign.make('Campaign 1', [tier10]).value!
      expect(c1.isEqual(c1)).toBe(true)
    })

    it('should verify equivalent equality by ID', () => {
      const c1 = Campaign.make('Campaign 1', [tier10]).value!
      const c1b = Campaign.fromSnapshot(c1.toSnapshot()).value!
      expect(c1.isEqual(c1b)).toBe(true)
    })

    it('should verify inequality by ID', () => {
      const c1 = Campaign.make('Campaign 1', [tier10]).value!
      const c2 = Campaign.make('Campaign 2', [tier10]).value!
      expect(c1.isEqual(c2)).toBe(false)
    })
  })

  describe('hasName', () => {
    it('should return true if name matches', () => {
      const campaign = Campaign.make('Campaign 1').value!
      const name = Campaign.fromSnapshot(campaign.toSnapshot()).value!.toSnapshot().name
      expect(campaign.hasName(Name.fromSnapshot(name).value!)).toBe(true)
    })
    it('should return false if name does not match', () => {
      const campaign = Campaign.make('Campaign 1').value!
      const otherCampaign = Campaign.make('Campaign 2').value!
      const name = Campaign.fromSnapshot(otherCampaign.toSnapshot()).value!.toSnapshot().name
      expect(campaign.hasName(Name.fromSnapshot(name).value!)).toBe(false)
    })
  })

  describe('hasId', () => {
    it('should return true if id matches', () => {
      const campaign = Campaign.make('Campaign 1').value!
      expect(campaign.hasId(campaign.id)).toBe(true)
    })
    it('should return false if id does not match', () => {
      const c1 = Campaign.make('Campaign 1').value!
      const c2 = Campaign.make('Campaign 2').value!
      expect(c1.hasId(c2.id)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should toSnapshot a predictable structure', () => {
      const campaign = Campaign.make('My Campaign', [tier10]).value!
      const snapshot = campaign.toSnapshot()
      expect(snapshot).toEqual({
        id: snapshot.id,
        name: 'My Campaign',
        funding: {
          tiers: [{ id: snapshot.funding.tiers[0]!.id, name: 'Tier 10', value: 10 }],
          donations: [],
        },
      })
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
      const original = Campaign.make('My Campaign', [tier10, tier20]).value!
      original.makeDonation(Money.make(10).value!, supporter1.id)
      const snapshot = original.toSnapshot()

      const result = Campaign.fromSnapshot(snapshot)
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
      const stats = result.value!.supporterDonationStats(supporter1.id)
      const tiersArray = Array.from(stats.extractTiers())
      expect(tiersArray.length).toBe(1)
      expect(tiersArray[0]!.isEqual(tier10)).toBe(true)
    })

    it('should fail to fromSnapshot invalid id format', () => {
      const result = Campaign.fromSnapshot({
        id: 'SHORT',
        name: 'Valid Name',
        funding: { tiers: [], donations: [] },
      })
      expect(result).toBeFailureWithCode('ID_INVALID_LENGTH')
    })

    it('should fail to fromSnapshot invalid name format', () => {
      const result = Campaign.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'Ab',
        funding: { tiers: [], donations: [] },
      })
      expect(result).toBeFailureWithCode('CAMPAIGN_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot with invalid tier inside funding', () => {
      const result = Campaign.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'Valid Name',
        funding: { tiers: [{ id: 'A2CDEFGHJK', name: 'A', value: 10 }], donations: [] },
      })
      expect(result).toBeFailureWithCode('TIER_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot with invalid donation inside funding', () => {
      const result = Campaign.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'Valid Name',
        funding: {
          tiers: [],
          donations: [
            { id: 'A2CDEFGHJK', amount: -50, supporterId: supporter1.id.toSnapshot(), tier: null },
          ],
        },
      })
      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })

    it('should fail to fromSnapshot if campaign name is too short', () => {
      const result = Campaign.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'Ca',
        funding: { tiers: [], donations: [] },
      })
      expect(result).toBeFailureWithCode('CAMPAIGN_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot if tiers have duplicate values', () => {
      const result = Campaign.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'My Campaign',
        funding: {
          tiers: [tier10.toSnapshot(), { id: 'A2CDEFGHJK', name: 'Another Tier 10', value: 10 }],
          donations: [],
        },
      })
      expect(result).toBeFailureWithCode('TIER_VALUE_DUPLICATE')
    })
  })

  describe('makeDonation', () => {
    it('should fail to accept a donation with invalid (negative) amount', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
      const result = campaign.makeDonation(Money.make(-5).value!, supporter1.id)
      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })

    it('should accept a donation with unsufficient amount and return no tier', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
      const result = campaign.makeDonation(Money.make(9).value!, supporter1.id)
      expect(result).toBeSuccess()
      const stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().size).toBe(0)
    })

    it('should accept a donation with sufficient amount and return the matching tier', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
      const result = campaign.makeDonation(Money.make(10).value!, supporter1.id)
      expect(result).toBeSuccess()
      const stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier10)).toBe(true)
    })

    it('should accept a donation and return the largest matching tier', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

      const result1 = campaign.makeDonation(Money.make(20).value!, supporter1.id)
      expect(result1).toBeSuccess()
      let stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier20)).toBe(true)

      const result2 = campaign.makeDonation(Money.make(25).value!, supporter1.id)
      expect(result2).toBeSuccess()
      stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier20)).toBe(true)
    })

    it('should accept multiple donations of the same amount', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

      const result1 = campaign.makeDonation(Money.make(10).value!, supporter1.id)
      expect(result1).toBeSuccess()
      let stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier10)).toBe(true)

      const result2 = campaign.makeDonation(Money.make(10).value!, supporter1.id)
      expect(result2).toBeSuccess()
      stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier10)).toBe(true)
      expect(stats.calculateTotal().toSnapshot()).toBe(20)
    })

    it('should accept multiple donations of different amounts', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!

      const result1 = campaign.makeDonation(Money.make(10).value!, supporter1.id)
      expect(result1).toBeSuccess()
      let stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier10)).toBe(true)

      const result2 = campaign.makeDonation(Money.make(20).value!, supporter1.id)
      expect(result2).toBeSuccess()
      stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier20)).toBe(true)
      expect(stats.calculateTotal().toSnapshot()).toBe(30)
    })
  })

  describe('supporterDonationStats', () => {
    it('should return empty stats for a supporter with no donations', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
      const stats = campaign.supporterDonationStats(supporter1.id)

      expect(stats.extractTiers().size).toBe(0)
      expect(stats.calculateTotal().toSnapshot()).toBe(0)
    })

    it('should return correct stats for a supporter with donations', () => {
      const campaign = Campaign.make('My Campaign', [tier10, tier20]).value!
      campaign.makeDonation(Money.make(10).value!, supporter1.id)

      const stats = campaign.supporterDonationStats(supporter1.id)
      expect(stats.extractTiers().has(tier10)).toBe(true)
      expect(stats.calculateTotal().toSnapshot()).toBe(10)

      // Test caching logic by calling a second time
      expect(stats.extractTiers().has(tier10)).toBe(true)
      expect(stats.calculateTotal().toSnapshot()).toBe(10)
    })
  })
})
