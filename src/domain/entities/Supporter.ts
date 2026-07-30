import { Email, type EmailExported } from '@values/Email'
import { Name, type NameExported } from '@values/Name'
import { Result } from '@values/Result'

export class Supporter {
  protected constructor(
    protected name: SupporterName,
    protected email: Email
  ) {}

  isEqual(other: Supporter): boolean {
    return this.name.isEqual(other.name) && this.email.isEqual(other.email)
  }

  export(): SupporterExported {
    return {
      name: this.name.export(),
      email: this.email.export(),
    }
  }

  static import(exported: SupporterExported): Result<Supporter> {
    return this.make(exported.name, exported.email)
  }

  static make(name: string, email: string): Result<Supporter> {
    const nameResult = SupporterName.make(name)
    if (nameResult.error) return nameResult

    const emailResult = Email.make(email)
    if (emailResult.error) return emailResult

    return Result.succeed(new Supporter(nameResult.value, emailResult.value))
  }
}

class SupporterName extends Name {
  static override make(value: string): Result<SupporterName> {
    const normalized = this.validate(value)
    if (normalized.error) return normalized

    return Result.succeed(new SupporterName(normalized.value))
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value.length < 3) {
      return Result.fail(new Error('Supporter name should be at least 3 characters long.'))
    }

    return baseValidation
  }
}

export interface SupporterExported {
  name: NameExported
  email: EmailExported
}
