import { CreateSupporterUseCase } from '@app/use_cases/CreateSupporterUseCase'
import { Supporter } from '@entities/Supporter'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Exception, ExceptionGroup } from '@values/Exception'
import { Result } from '@values/Result'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateSupporterUseCase', () => {
  let repository: SupporterRepositoryInMemory
  let useCase: CreateSupporterUseCase

  beforeEach(() => {
    repository = new SupporterRepositoryInMemory()
    useCase = new CreateSupporterUseCase(repository)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('execute', () => {
    it('should create and persist a new supporter successfully', async () => {
      const result = await useCase.execute({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toBeSuccess()

      const email = Email.make('john@example.com').value!
      const saved = await repository.findByEmail(email)

      expect(saved).toBeSuccess()
      expect(saved.value).not.toBeNull()
      expect(saved.value!.toSnapshot().name).toEqual('John Doe')
    })

    it('should fail if the email format is invalid', async () => {
      const result = await useCase.execute({ name: 'John Doe', email: 'invalid-email' })
      expect(result).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
    })

    it('should fail if the name is invalid for a supporter', async () => {
      // 2 characters, less than the minimum of 3 required by SupporterName
      const result = await useCase.execute({ name: 'Jo', email: 'john@example.com' })
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })

    it('should fail if the email is already in use by another supporter', async () => {
      // Pre-populate repository with a supporter using the same email
      const existingSupporter = Supporter.make('Jane Doe', 'john@example.com').value!
      await repository.upsert(existingSupporter)

      const result = await useCase.execute({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toBeFailureWithCode('SUPPORTER_EMAIL_ALREADY_EXISTS')
    })

    it('should return failure if repository findByEmail fails', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue(
        Result.fail(Exception.make(ExceptionGroup.Infrastructure, 'DB_FIND_ERROR'))
      )

      const result = await useCase.execute({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toBeFailureWithCode('DB_FIND_ERROR')
    })

    it('should return failure if repository upsert fails', async () => {
      vi.spyOn(repository, 'upsert').mockResolvedValue(
        Result.fail(Exception.make(ExceptionGroup.Infrastructure, 'DB_UPSERT_ERROR'))
      )

      const result = await useCase.execute({ name: 'John Doe', email: 'john@example.com' })
      expect(result).toBeFailureWithCode('DB_UPSERT_ERROR')
    })
  })
})
