import { SupporterDonationStatsUseCase } from '@app/use_cases/SupporterDonationStatsUseCase'
import { Campaign } from '@entities/Campaign'
import { Supporter } from '@entities/Supporter'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { beforeEach, describe, expect, it } from 'vitest'

describe('SupporterDonationStatsUseCase', () => {
  let campaignRepository: CampaignRepositoryInMemory
  let supporterRepository: SupporterRepositoryInMemory
  let useCase: SupporterDonationStatsUseCase

  let supporter: Supporter
  let campaign: Campaign

  beforeEach(async () => {
    campaignRepository = new CampaignRepositoryInMemory()
    supporterRepository = new SupporterRepositoryInMemory()
    useCase = new SupporterDonationStatsUseCase(campaignRepository, supporterRepository)

    supporter = Supporter.make(
      Name.make('John Doe').value!,
      Email.make('john@example.com').value!
    ).value!
    await supporterRepository.upsert(supporter)

    campaign = Campaign.make(Name.make('Save the Whales').value!).value!
    await campaignRepository.upsert(campaign)
  })

  describe('execute', () => {
    it('should compute total donation amount and extract tiers for a supporter with multiple donations', async () => {
      campaign.makeTier(Name.make('Bronze').value!, Money.make(25).value!)
      campaign.makeTier(Name.make('Silver').value!, Money.make(50).value!)
      campaign.makeDonation(Money.make(25).value!, supporter.id)
      campaign.makeDonation(Money.make(60).value!, supporter.id)
      await campaignRepository.upsert(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
      })

      expect(result).toBeSuccess()
      const stats = result.value!
      expect(stats.calculateTotal().isEqual(Money.make(85).value!)).toBe(true)
      expect(stats.extractTiers().size).toBe(2)
      expect(stats.toSnapshot()).toEqual({
        total: 85,
        tiers: Array.from(stats.extractTiers()).map((t) => t.toSnapshot()),
      })
    })

    it('should return zero total and empty tiers when supporter has made no donations', async () => {
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
      })

      expect(result).toBeSuccess()
      const stats = result.value!
      expect(stats.calculateTotal().isEqual(Money.make(0).value!)).toBe(true)
      expect(stats.extractTiers().size).toBe(0)
      expect(stats.toSnapshot()).toEqual({
        total: 0,
        tiers: [],
      })
    })

    it('should return total amount and empty tiers when donations do not qualify for any tier', async () => {
      campaign.makeTier(Name.make('Gold').value!, Money.make(100).value!)
      campaign.makeDonation(Money.make(15).value!, supporter.id)
      campaign.makeDonation(Money.make(20).value!, supporter.id)
      await campaignRepository.upsert(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
      })

      expect(result).toBeSuccess()
      const stats = result.value!
      expect(stats.calculateTotal().isEqual(Money.make(35).value!)).toBe(true)
      expect(stats.extractTiers().size).toBe(0)
    })

    it('should isolate donations and only compute stats for the requested supporter', async () => {
      const otherSupporter = Supporter.make(
        Name.make('Jane Doe').value!,
        Email.make('jane@example.com').value!
      ).value!
      await supporterRepository.upsert(otherSupporter)

      campaign.makeTier(Name.make('Bronze').value!, Money.make(25).value!)
      campaign.makeDonation(Money.make(30).value!, supporter.id)
      campaign.makeDonation(Money.make(100).value!, otherSupporter.id)
      await campaignRepository.upsert(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
      })

      expect(result).toBeSuccess()
      const stats = result.value!
      expect(stats.calculateTotal().isEqual(Money.make(30).value!)).toBe(true)
      expect(stats.extractTiers().size).toBe(1)
    })

    it('should deduplicate tiers when a supporter makes multiple donations in the same tier', async () => {
      campaign.makeTier(Name.make('Bronze').value!, Money.make(25).value!)
      campaign.makeDonation(Money.make(25).value!, supporter.id)
      campaign.makeDonation(Money.make(30).value!, supporter.id)
      await campaignRepository.upsert(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
      })

      expect(result).toBeSuccess()
      const stats = result.value!
      expect(stats.calculateTotal().isEqual(Money.make(55).value!)).toBe(true)
      expect(stats.extractTiers().size).toBe(1)
    })

    it('should fail if the supporter does not exist', async () => {
      const nonExistentSupporterId = Id.make()

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: nonExistentSupporterId,
      })

      expect(result).toBeFailureWithCode('SUPPORTER_NOT_FOUND')
    })

    it('should fail if the campaign does not exist', async () => {
      const nonExistentCampaignId = Id.make()

      const result = await useCase.execute({
        campaignId: nonExistentCampaignId,
        supporterId: supporter.id,
      })

      expect(result).toBeFailureWithCode('CAMPAIGN_NOT_FOUND')
    })
  })
})
