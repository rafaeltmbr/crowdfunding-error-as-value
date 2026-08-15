import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Supporter } from '@entities/Supporter'
import { Email } from '@values/Email'
import { Exception } from '@values/Exception'
import { Id } from '@values/Id'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class CreateSupporterUseCase {
  constructor(private supporterRepository: SupporterRepository) {}

  public async execute(name: Name, email: Email): Promise<Result<Id>> {
    const duplicateResult = await this.validateEmailDuplication(email)
    if (duplicateResult.error) return duplicateResult

    const supporterResult = Supporter.make(name, email)
    if (supporterResult.error) return supporterResult

    const persistenceResult = await this.supporterRepository.upsert(supporterResult.value)
    if (persistenceResult.error) return persistenceResult

    return Result.succeed(supporterResult.value.id)
  }

  private async validateEmailDuplication(email: Email): Promise<Result<void>> {
    const foundResult = await this.supporterRepository.findByEmail(email)
    if (foundResult.error) return foundResult

    if (foundResult.value) {
      return Result.fail(Exception.validation('SUPPORTER_EMAIL_ALREADY_EXISTS', [email]))
    }

    return Result.succeed()
  }
}
