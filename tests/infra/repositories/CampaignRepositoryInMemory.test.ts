import { Campaign } from '@entities/Campaign'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { Id } from '@values/Id'
import { Name } from '@values/Name'
import { Result } from '@values/Result'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

describe('CampaignRepositoryInMemory', () => {
  let repository: CampaignRepositoryInMemory
  let campaign1: Campaign
  let campaign2: Campaign

  beforeEach(() => {
    repository = new CampaignRepositoryInMemory()
    campaign1 = Campaign.make('First Campaign').value!
    campaign2 = Campaign.make('Second Campaign').value!
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('upsert', () => {
    it('should save a new campaign when it does not exist', async () => {
      const result = await repository.upsert(campaign1)
      expect(result).toBeSuccess()

      const found = await repository.findById(campaign1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(campaign1)).toBe(true)
    })

    it('should update an existing campaign when it already exists', async () => {
      await repository.upsert(campaign1)

      const snapshot = campaign1.toSnapshot()
      const updatedSnapshot = { ...snapshot, name: 'Updated Campaign' }
      const updatedCampaign = Campaign.fromSnapshot(updatedSnapshot).value!

      const result = await repository.upsert(updatedCampaign)
      expect(result).toBeSuccess()

      const found = await repository.findById(campaign1.id)
      expect(found).toBeSuccess()
      expect(found.value!.toSnapshot().name).toBe('Updated Campaign')
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(campaign1)
      vi.spyOn(Campaign, 'fromSnapshot').mockReturnValue(Result.fail(new Error('Corrupted data')))

      const result = await repository.upsert(campaign2)
      expect(result).toBeFailureWithMessage('Corrupted data')
    })
  })

  describe('findById', () => {
    it('should return a success result with the campaign if found', async () => {
      await repository.upsert(campaign1)
      await repository.upsert(campaign2)

      const found = await repository.findById(campaign1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(campaign1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const randomId = Id.make()
      const found = await repository.findById(randomId)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(campaign1)
      await repository.upsert(campaign2)

      vi.spyOn(Campaign, 'fromSnapshot').mockReturnValue(Result.fail(new Error('Corrupted data')))

      const found = await repository.findById(campaign1.id)
      expect(found).toBeFailureWithMessage('Corrupted data')
    })
  })

  describe('findByName', () => {
    it('should return a success result with the campaign if found', async () => {
      await repository.upsert(campaign1)

      const name = Name.make('First Campaign').value!
      const found = await repository.findByName(name)

      expect(found).toBeSuccess()
      expect(found.value!.isEqual(campaign1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const name = Name.make('Nonexistent').value!
      const found = await repository.findByName(name)

      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(campaign1)
      vi.spyOn(Campaign, 'fromSnapshot').mockReturnValue(Result.fail(new Error('Corrupted data')))

      const name = Name.make('First Campaign').value!
      const found = await repository.findByName(name)
      expect(found).toBeFailureWithMessage('Corrupted data')
    })
  })

  describe('delete', () => {
    it('should remove an existing campaign and return success', async () => {
      await repository.upsert(campaign1)

      const deleteResult = await repository.delete(campaign1)
      expect(deleteResult).toBeSuccess()

      const found = await repository.findById(campaign1.id)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return a failure result if the campaign does not exist', async () => {
      const deleteResult = await repository.delete(campaign1)
      expect(deleteResult).toBeFailureWithMessage('Campaign does not exist.')
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(campaign1)
      vi.spyOn(Campaign, 'fromSnapshot').mockReturnValue(Result.fail(new Error('Corrupted data')))

      const deleteResult = await repository.delete(campaign1)
      expect(deleteResult).toBeFailureWithMessage('Corrupted data')
    })
  })
})
