import { Supporter } from '@entities/Supporter'
import { SupporterRepositoryInMemory } from '@repositories/impl/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { beforeEach, describe, expect, it } from 'vitest'

describe('SupporterRepositoryInMemory', () => {
  let repository: SupporterRepositoryInMemory
  let supporter1: Supporter
  let supporter2: Supporter

  beforeEach(() => {
    repository = new SupporterRepositoryInMemory()
    supporter1 = Supporter.make('John Doe', 'john@example.com').value!
    supporter2 = Supporter.make('Jane Doe', 'jane@example.com').value!
  })

  describe('upsert', () => {
    it('should save a new supporter when it does not exist', async () => {
      const result = await repository.upsert(supporter1)
      expect(result).toBeSuccess()

      const found = await repository.findById(supporter1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(supporter1)).toBe(true)
    })

    it('should update an existing supporter when it already exists', async () => {
      await repository.upsert(supporter1)

      const snapshot = supporter1.toSnapshot()
      const updatedSnapshot = { ...snapshot, name: 'John Smith' }
      const updatedSupporter = Supporter.fromSnapshot(updatedSnapshot).value!

      const result = await repository.upsert(updatedSupporter)
      expect(result).toBeSuccess()

      const found = await repository.findById(supporter1.id)
      expect(found).toBeSuccess()
      expect(found.value!.toSnapshot().name).toBe('John Smith')
    })
  })

  describe('findById', () => {
    it('should return a success result with the supporter if found', async () => {
      await repository.upsert(supporter1)
      await repository.upsert(supporter2)

      const found = await repository.findById(supporter1.id)
      expect(found).toBeSuccess()
      expect(found.value!.isEqual(supporter1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const randomId = Id.make()
      const found = await repository.findById(randomId)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return a success result with the supporter if found', async () => {
      await repository.upsert(supporter1)

      const email = Email.make('john@example.com').value!
      const found = await repository.findByEmail(email)

      expect(found).toBeSuccess()
      expect(found.value!.isEqual(supporter1)).toBe(true)
    })

    it('should return a success result with null if not found', async () => {
      const email = Email.make('nonexistent@example.com').value!
      const found = await repository.findByEmail(email)

      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })
  })

  describe('delete', () => {
    it('should remove an existing supporter and return success', async () => {
      await repository.upsert(supporter1)

      const deleteResult = await repository.delete(supporter1)
      expect(deleteResult).toBeSuccess()

      const found = await repository.findById(supporter1.id)
      expect(found).toBeSuccess()
      expect(found.value).toBeNull()
    })

    it('should return a failure result if the supporter does not exist', async () => {
      const deleteResult = await repository.delete(supporter1)
      expect(deleteResult).toBeFailureWithMessage('Supporter does not exist.')
    })
  })
})
