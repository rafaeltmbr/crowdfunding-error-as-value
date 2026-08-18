import { CreateCampaignUseCase } from '@app/use_cases/CreateCampaignUseCase'
import { Campaign } from '@entities/Campaign'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { beforeEach, describe, expect, it } from 'vitest'

describe('CreateCampaignUseCase', () => {
  let repository: CampaignRepositoryInMemory
  let useCase: CreateCampaignUseCase

  beforeEach(() => {
    repository = new CampaignRepositoryInMemory()
    useCase = new CreateCampaignUseCase(repository)
  })

  describe('execute', () => {
    it('should create a campaign with no tiers and persist it', async () => {
      const name = Name.make('Save the Whales').value!

      const result = await useCase.execute({ name, tiers: [] })

      expect(result).toBeSuccess()

      const saved = await repository.findByName(name)
      expect(saved.value).not.toBeNull()
      expect(saved.value!.id.isEqual(result.value!)).toBe(true)
    })

    it('should create a campaign with multiple tiers and persist all of them', async () => {
      const name = Name.make('Save the Whales').value!
      const tiers = [
        { name: Name.make('Bronze').value!, value: Money.make(10).value! },
        { name: Name.make('Silver').value!, value: Money.make(50).value! },
        { name: Name.make('Gold').value!, value: Money.make(100).value! },
      ]

      const result = await useCase.execute({ name, tiers })

      expect(result).toBeSuccess()

      const saved = await repository.findByName(name)
      expect(saved.value!.toSnapshot().funding.tiers).toHaveLength(3)
    })

    it('should fail if a campaign with the same name already exists', async () => {
      const name = Name.make('Save the Whales').value!
      const existing = Campaign.make(name).value!
      await repository.upsert(existing)

      const result = await useCase.execute({ name, tiers: [] })

      expect(result).toBeFailureWithCode('CAMPAIGN_NAME_ALREADY_EXISTS')
    })

    it('should fail if two tiers share the same value', async () => {
      const name = Name.make('Save the Whales').value!
      const tiers = [
        { name: Name.make('Bronze').value!, value: Money.make(10).value! },
        { name: Name.make('Silver').value!, value: Money.make(10).value! },
      ]

      const result = await useCase.execute({ name, tiers })

      expect(result).toBeFailureWithCode('TIER_VALUE_DUPLICATE')
    })
  })
})
