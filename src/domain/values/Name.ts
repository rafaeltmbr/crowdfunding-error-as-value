import { ValidationError } from '@values/DomainError'
import { Result } from '@values/Result'

export class Name {
  protected constructor(protected value: string) {}

  isEqual(other: Name): boolean {
    return this.value === other.value
  }

  toSnapshot(): NameSnapshot {
    return this.value
  }

  static fromSnapshot(snapshot: NameSnapshot): Result<Name> {
    return this.make(snapshot)
  }

  static make(value: string): Result<Name> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Name(validation.value))
  }

  protected static validate(value: string): Result<string> {
    const normalized = value
      .split(/\s/)
      .filter((c) => c !== '')
      .join(' ')

    if (normalized === '') return Result.fail(new EmptyNameError())

    return Result.succeed(normalized)
  }
}

export class EmptyNameError extends ValidationError {
  constructor() {
    super('NAME_EMPTY', 'Name should not be empty.')
  }
}

export type NameSnapshot = string
