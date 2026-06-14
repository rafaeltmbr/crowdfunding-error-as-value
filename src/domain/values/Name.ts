import { Result } from '@values/Result'

export class Name {
  protected constructor(protected value: string) {}

  export(): unknown {
    return this.value
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

    if (normalized === '') {
      return Result.fail(new Error('Name should not be empty.'))
    }

    return Result.succeed(normalized)
  }
}
