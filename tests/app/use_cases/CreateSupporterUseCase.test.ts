import { CreateSupporterUseCase } from '@app/use_cases/CreateSupporterUseCase'
import { Supporter } from '@entities/Supporter'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { Name } from '@values/Name'
import { beforeEach, describe, expect, it } from 'vitest'

describe('CreateSupporterUseCase', () => {
  let repository: SupporterRepositoryInMemory
  let useCase: CreateSupporterUseCase

  beforeEach(() => {
    repository = new SupporterRepositoryInMemory()
    useCase = new CreateSupporterUseCase(repository)
  })

  describe('execute', () => {
    it('should create a supporter and persist it, returning the generated id', async () => {
      const name = Name.make('John Doe').value!
      const email = Email.make('john@example.com').value!

      const result = await useCase.execute(name, email)

      expect(result).toBeSuccess()
      expect(result.value).toBeInstanceOf(Id)

      const saved = await repository.findByEmail(email)
      expect(saved.value).not.toBeNull()
      expect(saved.value!.id.isEqual(result.value!)).toBe(true)
      expect(saved.value!.toSnapshot().name).toEqual('John Doe')
    })

    it('should fail if the email is already registered to another supporter', async () => {
      const email = Email.make('john@example.com').value!
      const existing = Supporter.make(Name.make('Jane Doe').value!, email).value!
      await repository.upsert(existing)

      const result = await useCase.execute(Name.make('John Doe').value!, email)

      expect(result).toBeFailureWithCode('SUPPORTER_EMAIL_ALREADY_EXISTS')
    })

    it('should fail if the name is too short for a supporter', async () => {
      const name = Name.make('Jo').value!
      const email = Email.make('jo@example.com').value!

      const result = await useCase.execute(name, email)

      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })
  })
})
