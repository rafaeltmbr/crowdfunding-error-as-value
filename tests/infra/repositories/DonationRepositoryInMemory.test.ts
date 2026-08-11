import { Exception } from '@values/Exception'
import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { DonationRepositoryInMemory } from '@infra/repositories/DonationRepositoryInMemory'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Result } from '@values/Result'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

describe('DonationRepositoryInMemory', () => {
  let repository: DonationRepositoryInMemory
  let donation1: Donation
  let donation2: Donation
  let supporter1: Supporter

  beforeEach(() => {
    repository = new DonationRepositoryInMemory()
    supporter1 = Supporter.make('John Doe', 'john@example.com').value!
    const amount1 = Money.make(50).value!
    const amount2 = Money.make(100).value!
    donation1 = Donation.make(amount1, supporter1.id).value!
    donation2 = Donation.make(amount2, supporter1.id).value!
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('upsert', () => {
    it('should save a new donation when it does not exist', async () => {
      const result = await repository.upsert(donation1)
      expect(result).toBeSuccess()

      const found = await repository.findById(donation1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(donation1)).toBe(true)
    })

    it('should update an existing donation when it already exists', async () => {
      await repository.upsert(donation1)

      const snapshot = donation1.toSnapshot()
      const updatedSnapshot = { ...snapshot, amount: 200 }
      const updatedDonation = Donation.fromSnapshot(updatedSnapshot).value!

      const result = await repository.upsert(updatedDonation)
      expect(result).toBeSuccess()

      const found = await repository.findById(donation1.id)
      expect(found).toBeSuccess()
      expect(found.value!.toSnapshot().amount).toBe(200)
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(donation1)
      vi.spyOn(Donation, 'fromSnapshot').mockReturnValue(
        Result.fail(Exception.validation('CORRUPTED_DATA'))
      )

      const result = await repository.upsert(donation2)
      expect(result).toBeFailureWithCode('CORRUPTED_DATA')
    })
  })

  describe('findById', () => {
    it('should return a success result with the donation if found', async () => {
      await repository.upsert(donation1)
      await repository.upsert(donation2)

      const found = await repository.findById(donation1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(donation1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const randomId = Id.make()
      const found = await repository.findById(randomId)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(donation1)
      await repository.upsert(donation2)

      vi.spyOn(Donation, 'fromSnapshot').mockReturnValue(
        Result.fail(Exception.validation('CORRUPTED_DATA'))
      )

      const found = await repository.findById(donation1.id)
      expect(found).toBeFailureWithCode('CORRUPTED_DATA')
    })
  })

  describe('findBySupporterId', () => {
    it('should return a success result with the donation if found', async () => {
      await repository.upsert(donation1)

      const found = await repository.findBySupporterId(supporter1.id)

      expect(found).toBeSuccess()
      expect(found.value!.isEqual(donation1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const randomId = Id.make()
      const found = await repository.findBySupporterId(randomId)

      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(donation1)
      vi.spyOn(Donation, 'fromSnapshot').mockReturnValue(
        Result.fail(Exception.validation('CORRUPTED_DATA'))
      )

      const found = await repository.findBySupporterId(supporter1.id)
      expect(found).toBeFailureWithCode('CORRUPTED_DATA')
    })
  })

  describe('delete', () => {
    it('should remove an existing donation and return success', async () => {
      await repository.upsert(donation1)

      const deleteResult = await repository.delete(donation1)
      expect(deleteResult).toBeSuccess()

      const found = await repository.findById(donation1.id)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return a failure result if the donation does not exist', async () => {
      const deleteResult = await repository.delete(donation1)
      expect(deleteResult).toBeFailureWithCode('DONATION_NOT_FOUND')
    })

    it('should return failure if deserialization fails', async () => {
      await repository.upsert(donation1)
      vi.spyOn(Donation, 'fromSnapshot').mockReturnValue(
        Result.fail(Exception.validation('CORRUPTED_DATA'))
      )

      const deleteResult = await repository.delete(donation1)
      expect(deleteResult).toBeFailureWithCode('CORRUPTED_DATA')
    })
  })
})
