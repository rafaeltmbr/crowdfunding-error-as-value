import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Supporter } from '@entities/Supporter'
import { Email } from '@values/Email'
import { Exception } from '@values/Exception'
import { Result } from '@values/Result'

export class CreateSupporterUseCase {
  constructor(private supporterRepository: SupporterRepository) {}

  public async execute(params: CreateSupporterParams): Promise<Result<void>> {
    const duplicateResult = await this.validateEmailDuplication(params.email)
    if (duplicateResult.error) return duplicateResult

    const supporterResult = Supporter.make(params.name, params.email)
    if (supporterResult.error) return supporterResult

    const persistenceResult = await this.supporterRepository.upsert(supporterResult.value)
    if (persistenceResult.error) return persistenceResult

    return Result.succeed()
  }

  private async validateEmailDuplication(email: string): Promise<Result<void>> {
    const emailResult = Email.make(email)
    if (emailResult.error) return emailResult

    const foundResult = await this.supporterRepository.findByEmail(emailResult.value)
    if (foundResult.error) return foundResult

    if (foundResult.value) {
      return Result.fail(Exception.validation('SUPPORTER_EMAIL_ALREADY_EXISTS', [email]))
    }

    return Result.succeed()
  }
}

export interface CreateSupporterParams {
  name: string
  email: string
}
