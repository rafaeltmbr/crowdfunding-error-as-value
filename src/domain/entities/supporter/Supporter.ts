import { Email, type EmailSnapshot } from '@values/Email'
import { Exception } from '@values/Exception'
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

  hasId(id: Id): boolean {
    return this._id.isEqual(id)
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

  static make(name: Name, email: Email): Result<Supporter> {
    const nameResult = SupporterName.from(name)
    if (nameResult.error) return nameResult

    return Result.succeed(new Supporter(Id.make(), nameResult.value, email))
  }
}

class SupporterName extends Name {
  protected constructor(value: string) {
    super(value)
  }

  static override make(value: string): Result<SupporterName> {
    return Result.fail(Exception.unexpected('SUPPORTER_NAME_INVALID_FACTORY_METHOD', [value]))
  }

  static from(baseName: Name): Result<SupporterName> {
    const rawValue = (baseName as SupporterName).value
    const normalized = this.validate(rawValue)
    if (normalized.error) return normalized

    return Result.succeed(new SupporterName(normalized.value))
  }

  static override fromSnapshot(snapshot: string): Result<SupporterName> {
    const normalized = this.validate(snapshot)
    if (normalized.error) return normalized

    return Result.succeed(new SupporterName(normalized.value))
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value.length < 3) {
      return Result.fail(Exception.validation('SUPPORTER_NAME_MIN_LENGTH', [3]))
    }

    return baseValidation
  }
}

export interface SupporterSnapshot {
  id: IdSnapshot
  name: NameSnapshot
  email: EmailSnapshot
}
