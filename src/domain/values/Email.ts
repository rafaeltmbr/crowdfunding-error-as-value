import { Result } from './Result'

export class Email {
  protected constructor(protected value: string) {}

  isEqual(other: Email): boolean {
    return this.value === other.value
  }

  export(): unknown {
    return this.value
  }

  static import(data: unknown): Result<Email> {
    if (typeof data !== 'string') {
      return Result.fail(new Error('Cannot import Email from invalid data format.'))
    }

    return this.make(data)
  }

  static make(value: string): Result<Email> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Email(validation.value))
  }

  protected static validate(value: string): Result<string> {
    const normalized = value
      .toLowerCase()
      .split(/\s/)
      .filter((c) => c !== '')
      .join('')

    if (normalized.length === 0) return Result.fail(new Error('Email should not be empty.'))

    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    if (!normalized.match(pattern)) return Result.fail(new Error('Email format should be valid.'))

    return Result.succeed(normalized)
  }
}
