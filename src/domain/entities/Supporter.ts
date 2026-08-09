import { Email, type EmailSnapshot } from '@values/Email'
import { Id, IdSnapshot } from '@values/Id'
import { Name, type NameSnapshot } from '@values/Name'
import { Result } from '@values/Result'

export class Supporter {
  protected constructor(
    protected _id: Id,
    protected name: SupporterName,
    protected email: Email
  ) {}

  get id(): Id {
    return this._id
  }

  isEqual(other: Supporter): boolean {
    return this._id.isEqual(other._id)
  }

  isUsingEmail(email: Email): boolean {
    return this.email.isEqual(email)
  }

  toSnapshot(): SupporterSnapshot {
    return {
      id: this._id.toSnapshot(),
      name: this.name.toSnapshot(),
      email: this.email.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: SupporterSnapshot): Result<Supporter> {
    const idResult = Id.fromSnapshot(snapshot.id)
    if (idResult.error) return idResult

    const nameResult = SupporterName.fromSnapshot(snapshot.name)
    if (nameResult.error) return nameResult

    const emailResult = Email.fromSnapshot(snapshot.email)
    if (emailResult.error) return emailResult

    return Result.succeed(new Supporter(idResult.value, nameResult.value, emailResult.value))
  }

  static make(name: string, email: string): Result<Supporter> {
    const nameResult = SupporterName.make(name)
    if (nameResult.error) return nameResult

    const emailResult = Email.make(email)
    if (emailResult.error) return emailResult

    return Result.succeed(new Supporter(Id.make(), nameResult.value, emailResult.value))
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

export interface SupporterSnapshot {
  id: IdSnapshot
  name: NameSnapshot
  email: EmailSnapshot
}
