import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Email } from '@common_values/Email'
import { Exception } from '@common_values/Exception'
import { Id } from '@common_values/Id'
import { Name } from '@common_values/Name'
import { Result } from '@common_values/Result'
import { Supporter } from '@domain/supporter'

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
