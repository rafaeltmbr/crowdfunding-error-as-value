import { ValidationError } from '@values/DomainError'
import { Result } from '@values/Result'

export class Email {
  protected constructor(protected value: string) {}

  isEqual(other: Email): boolean {
    return this.value === other.value
  }

  toSnapshot(): EmailSnapshot {
    return this.value
  }

  static fromSnapshot(snapshot: EmailSnapshot): Result<Email> {
    return this.make(snapshot)
  }

  static make(value: string): Result<Email> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Email(validation.value))
  }

  protected static validate(value: string): Result<string> {
    const normalized = this.normalize(value)

    const lengthResult = this.validateLength(normalized)
    if (lengthResult.error) return lengthResult

    const partsResult = this.validateParts(normalized)
    if (partsResult.error) return partsResult

    const patternResult = this.validatePattern(normalized)
    if (patternResult.error) return patternResult

    return Result.succeed(normalized)
  }

  private static normalize(value: string): string {
    return value
      .toLowerCase()
      .split(/\s/)
      .filter((c) => c !== '')
      .join('')
  }

  private static validateLength(normalized: string): Result<void> {
    if (normalized.length === 0) return Result.fail(new EmptyEmailError())

    if (normalized.length > 254) return Result.fail(new InvalidEmailFormatError())

    return Result.succeed()
  }

  private static validateParts(normalized: string): Result<void> {
    const parts = normalized.split('@')
    if (parts.length <= 1) return Result.succeed()

    if (parts[0]!.length > 64) return Result.fail(new InvalidEmailFormatError())

    const domainParts = parts[1]!.split('.')

    if (domainParts.some((part) => part.length > 63)) {
      return Result.fail(new InvalidEmailFormatError())
    }

    return Result.succeed()
  }

  private static validatePattern(normalized: string): Result<void> {
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    if (!normalized.match(pattern)) return Result.fail(new InvalidEmailFormatError())

    return Result.succeed()
  }
}

export class EmptyEmailError extends ValidationError {
  constructor() {
    super('EMAIL_EMPTY', 'Email should not be empty.')
  }
}

export class InvalidEmailFormatError extends ValidationError {
  constructor() {
    super('EMAIL_INVALID_FORMAT', 'Email format should be valid.')
  }
}

export type EmailSnapshot = string
