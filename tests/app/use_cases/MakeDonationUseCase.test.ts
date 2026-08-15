import { MakeDonationUseCase } from '@app/use_cases/MakeDonationUseCase'
import { Campaign } from '@entities/Campaign'
import { Supporter } from '@entities/Supporter'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Exception } from '@values/Exception'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { Result } from '@values/Result'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('MakeDonationUseCase', () => {
  let campaignRepository: CampaignRepositoryInMemory
  let supporterRepository: SupporterRepositoryInMemory
  let useCase: MakeDonationUseCase

  beforeEach(() => {
    campaignRepository = new CampaignRepositoryInMemory()
    supporterRepository = new SupporterRepositoryInMemory()
    useCase = new MakeDonationUseCase(campaignRepository, supporterRepository)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('execute', () => {
    it('should make a donation successfully when supporter and campaign exist and donation amount is positive', async () => {
      const supporterName = Name.make('John Doe').value!
      const supporterEmail = Email.make('john@example.com').value!
      const supporter = Supporter.make(supporterName, supporterEmail).value!
      await supporterRepository.upsert(supporter)

      const campaignName = Name.make('Save the Whales').value!
      const campaign = Campaign.make(campaignName).value!
      await campaignRepository.upsert(campaign)

      const amount = Money.make(50).value!
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount,
      })

      expect(result).toBeSuccess()

      const savedCampaignResult = await campaignRepository.findById(campaign.id)
      expect(savedCampaignResult).toBeSuccess()
      expect(savedCampaignResult.value!.toSnapshot().funding.donations).toHaveLength(1)
    })

    it('should fail if donation amount is zero', async () => {
      const supporterName = Name.make('John Doe').value!
      const supporterEmail = Email.make('john@example.com').value!
      const supporter = Supporter.make(supporterName, supporterEmail).value!
      await supporterRepository.upsert(supporter)

      const campaignName = Name.make('Save the Whales').value!
      const campaign = Campaign.make(campaignName).value!
      await campaignRepository.upsert(campaign)

      const zeroAmount = Money.make(0).value!
      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount: zeroAmount,
      })

      expect(result).toBeFailureWithCode('DONATION_MONEY_NON_POSITIVE')
    })

    it('should return failure if supporter repository findById fails', async () => {
      vi.spyOn(supporterRepository, 'findById').mockResolvedValue(
        Result.fail(Exception.infrastructure('DB_FIND_ERROR'))
      )

      const campaignId = Id.make()
      const supporterId = Id.make()
      const amount = Money.make(50).value!

      const result = await useCase.execute({ campaignId, supporterId, amount })
      expect(result).toBeFailureWithCode('DB_FIND_ERROR')
    })

    it('should fail if supporter is not found', async () => {
      const campaignName = Name.make('Save the Whales').value!
      const campaign = Campaign.make(campaignName).value!
      await campaignRepository.upsert(campaign)

      const nonExistentSupporterId = Id.make()
      const amount = Money.make(50).value!

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: nonExistentSupporterId,
        amount,
      })

      expect(result).toBeFailureWithCode('SUPPORTER_NOT_FOUND')
    })

    it('should return failure if campaign repository findById fails', async () => {
      const supporterName = Name.make('John Doe').value!
      const supporterEmail = Email.make('john@example.com').value!
      const supporter = Supporter.make(supporterName, supporterEmail).value!
      await supporterRepository.upsert(supporter)

      vi.spyOn(campaignRepository, 'findById').mockResolvedValue(
        Result.fail(Exception.infrastructure('DB_FIND_ERROR'))
      )

      const campaignId = Id.make()
      const amount = Money.make(50).value!

      const result = await useCase.execute({
        campaignId,
        supporterId: supporter.id,
        amount,
      })

      expect(result).toBeFailureWithCode('DB_FIND_ERROR')
    })

    it('should fail if campaign is not found', async () => {
      const supporterName = Name.make('John Doe').value!
      const supporterEmail = Email.make('john@example.com').value!
      const supporter = Supporter.make(supporterName, supporterEmail).value!
      await supporterRepository.upsert(supporter)

      const nonExistentCampaignId = Id.make()
      const amount = Money.make(50).value!

      const result = await useCase.execute({
        campaignId: nonExistentCampaignId,
        supporterId: supporter.id,
        amount,
      })

      expect(result).toBeFailureWithCode('CAMPAIGN_NOT_FOUND')
    })

    it('should return failure if campaign repository upsert fails', async () => {
      const supporterName = Name.make('John Doe').value!
      const supporterEmail = Email.make('john@example.com').value!
      const supporter = Supporter.make(supporterName, supporterEmail).value!
      await supporterRepository.upsert(supporter)

      const campaignName = Name.make('Save the Whales').value!
      const campaign = Campaign.make(campaignName).value!
      await campaignRepository.upsert(campaign)

      vi.spyOn(campaignRepository, 'upsert').mockResolvedValue(
        Result.fail(Exception.infrastructure('DB_UPSERT_ERROR'))
      )

      const amount = Money.make(50).value!

      const result = await useCase.execute({
        campaignId: campaign.id,
        supporterId: supporter.id,
        amount,
      })

      expect(result).toBeFailureWithCode('DB_UPSERT_ERROR')
    })
  })
})
