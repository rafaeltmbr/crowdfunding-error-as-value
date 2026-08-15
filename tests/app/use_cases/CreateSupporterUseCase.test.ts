import { CreateSupporterUseCase } from '@app/use_cases/CreateSupporterUseCase'
import { Supporter } from '@entities/Supporter'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Exception } from '@values/Exception'
import { Id } from '@values/Id'
import { Result } from '@values/Result'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Name } from '@values/Name'

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
    it('should create and persist a new supporter successfully and return its id', async () => {
      const name = Name.make('John Doe').value!
      const email = Email.make('john@example.com').value!
      const result = await useCase.execute(name, email)
      expect(result).toBeSuccess()
      expect(result.value).toBeInstanceOf(Id)

      const saved = await repository.findByEmail(email)

      expect(saved).toBeSuccess()
      expect(saved.value).not.toBeNull()
      expect(saved.value!.id.isEqual(result.value!)).toBe(true)
      expect(saved.value!.toSnapshot().name).toEqual('John Doe')
    })

    it('should fail if the name is invalid for a supporter', async () => {
      // 2 characters, less than the minimum of 3 required by SupporterName
      const name = Name.make('Jo').value!
      const email = Email.make('john@example.com').value!
      const result = await useCase.execute(name, email)
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })

    it('should fail if the email is already in use by another supporter', async () => {
      // Pre-populate repository with a supporter using the same email
      const existingSupporter = Supporter.make(
        Name.make('Jane Doe').value!,
        Email.make('john@example.com').value!
      ).value!
      await repository.upsert(existingSupporter)

      const result = await useCase.execute(
        Name.make('John Doe').value!,
        Email.make('john@example.com').value!
      )
      expect(result).toBeFailureWithCode('SUPPORTER_EMAIL_ALREADY_EXISTS')
    })

    it('should return failure if repository findByEmail fails', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue(
        Result.fail(Exception.infrastructure('DB_FIND_ERROR'))
      )

      const result = await useCase.execute(
        Name.make('John Doe').value!,
        Email.make('john@example.com').value!
      )
      expect(result).toBeFailureWithCode('DB_FIND_ERROR')
    })

    it('should return failure if repository upsert fails', async () => {
      vi.spyOn(repository, 'upsert').mockResolvedValue(
        Result.fail(Exception.infrastructure('DB_UPSERT_ERROR'))
      )

      const result = await useCase.execute(
        Name.make('John Doe').value!,
        Email.make('john@example.com').value!
      )
      expect(result).toBeFailureWithCode('DB_UPSERT_ERROR')
    })
  })
})
