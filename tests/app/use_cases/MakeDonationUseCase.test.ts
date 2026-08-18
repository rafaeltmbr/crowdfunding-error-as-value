import { MakeDonationUseCase } from '@app/use_cases/MakeDonationUseCase'
import { Campaign } from '@entities/Campaign'
import { Supporter } from '@entities/Supporter'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { beforeEach, describe, expect, it } from 'vitest'

describe('MakeDonationUseCase', () => {
  let campaignRepository: CampaignRepositoryInMemory
  let supporterRepository: SupporterRepositoryInMemory
  let useCase: MakeDonationUseCase

  let supporter: Supporter
  let campaign: Campaign

  beforeEach(async () => {
    campaignRepository = new CampaignRepositoryInMemory()
    supporterRepository = new SupporterRepositoryInMemory()
    useCase = new MakeDonationUseCase(campaignRepository, supporterRepository)

    supporter = Supporter.make(
      Name.make('John Doe').value!,
      Email.make('john@example.com').value!
    ).value!
    await supporterRepository.upsert(supporter)

    campaign = Campaign.make(Name.make('Save the Whales').value!).value!
    await campaignRepository.upsert(campaign)
  })

  describe('execute', () => {
    it('should record a donation on the campaign when supporter and campaign exist', async () => {
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: Money.make(50).value!,
      })

      expect(result).toBeSuccess()

      const saved = await campaignRepository.findById(campaign.id)
      expect(saved.value!.toSnapshot().funding.donations).toHaveLength(1)
    })

    it('should link the donation to the matching tier when the amount qualifies', async () => {
      campaign.makeTier(Name.make('Supporter').value!, Money.make(25).value!)
      await campaignRepository.upsert(campaign)

      await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: Money.make(25).value!,
      })

      const saved = await campaignRepository.findById(campaign.id)
      const donation = saved.value!.toSnapshot().funding.donations[0]!
      expect(donation.tier).not.toBeNull()
    })

    it('should record the donation without a tier when no tier matches the amount', async () => {
      campaign.makeTier(Name.make('Supporter').value!, Money.make(100).value!)
      await campaignRepository.upsert(campaign)

      await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: Money.make(10).value!,
      })

      const saved = await campaignRepository.findById(campaign.id)
      const donation = saved.value!.toSnapshot().funding.donations[0]!
      expect(donation.tier).toBeNull()
    })

    it('should fail if the supporter does not exist', async () => {
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: Id.make(),
        amount: Money.make(50).value!,
      })

      expect(result).toBeFailureWithCode('SUPPORTER_NOT_FOUND')
    })

    it('should fail if the campaign does not exist', async () => {
      const result = await useCase.execute({
        campaignId: Id.make(),
        supporterId: supporter.id,
        amount: Money.make(50).value!,
      })

      expect(result).toBeFailureWithCode('CAMPAIGN_NOT_FOUND')
    })

    it('should fail if the donation amount is zero', async () => {
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: Money.make(0).value!,
      })

      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })

    it('should fail if the donation amount is negative', async () => {
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: Money.make(-1).value!,
      })

      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })
  })
})
