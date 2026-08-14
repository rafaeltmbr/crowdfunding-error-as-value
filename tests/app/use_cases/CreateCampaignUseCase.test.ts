import { CreateCampaignUseCase } from '@app/use_cases/CreateCampaignUseCase'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { Name } from '@values/Name'
import { Money } from '@values/Money'
import { Exception, ExceptionGroup } from '@values/Exception'
import { Result } from '@values/Result'
import { Tier } from '@entities/Tier'
import { Campaign } from '@entities/Campaign'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateCampaignUseCase', () => {
  let repository: CampaignRepositoryInMemory
  let useCase: CreateCampaignUseCase

  beforeEach(() => {
    repository = new CampaignRepositoryInMemory()
    useCase = new CreateCampaignUseCase(repository)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('execute', () => {
    it('should create and persist a new campaign successfully', async () => {
      const name = Name.make('Save the Whales').value!
      const tiers = [Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!]

      const result = await useCase.execute(name, tiers)
      expect(result).toBeSuccess()

      const saved = await repository.findByName(name)
      expect(saved).toBeSuccess()
      expect(saved.value).not.toBeNull()
      expect(saved.value!.toSnapshot().name).toEqual('Save the Whales')
    })

    it('should return failure if repository findByName fails', async () => {
      vi.spyOn(repository, 'findByName').mockResolvedValue(
        Result.fail(Exception.make(ExceptionGroup.Infrastructure, 'DB_FIND_ERROR'))
      )

      const name = Name.make('Save the Whales').value!
      const tiers = [Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!]

      const result = await useCase.execute(name, tiers)
      expect(result).toBeFailureWithCode('DB_FIND_ERROR')
    })

    it('should fail if campaign creation fails', async () => {
      const name = Name.make('Save the Whales').value!
      // Provide duplicate tiers to trigger a validation error in Campaign.make
      const tiers = [
        Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!,
        Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!,
      ]

      const result = await useCase.execute(name, tiers)
      expect(result).toBeFailureWithCode('TIER_VALUE_DUPLICATE')
    })

    it('should return failure if repository upsert fails', async () => {
      vi.spyOn(repository, 'upsert').mockResolvedValue(
        Result.fail(Exception.make(ExceptionGroup.Infrastructure, 'DB_UPSERT_ERROR'))
      )

      const name = Name.make('Save the Whales').value!
      const tiers = [Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!]

      const result = await useCase.execute(name, tiers)
      expect(result).toBeFailureWithCode('DB_UPSERT_ERROR')
    })

    it('should fail if the campaign already exists', async () => {
      const name = Name.make('Save the Whales').value!
      const tiers = [Tier.make(Name.make('Basic').value!, Money.make(10).value!).value!]

      // Pre-populate repository with a campaign using the same name
      const existingCampaign = Campaign.make(name, tiers).value!
      await repository.upsert(existingCampaign)

      const result = await useCase.execute(name, tiers)
      expect(result).toBeFailureWithCode('CAMPAIGN_NAME_ALREADY_EXISTS')
    })
  })
})
