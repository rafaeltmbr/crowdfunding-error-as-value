import { ValidationError } from '@values/DomainError'
import { Result } from '@values/Result'

export class Id {
  protected static ALPHABET: Readonly<string> = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  protected static ALPHABET_SET: ReadonlySet<string> = new Set(this.ALPHABET.split(''))
  protected static LENGTH: Readonly<number> = 10

  protected constructor(protected value: string) {}

  isEqual(other: Id): boolean {
    return this.value === other.value
  }

  toSnapshot(): IdSnapshot {
    return this.value
  }

  static fromSnapshot(snapshot: IdSnapshot): Result<Id> {
    const validation = this.validate(snapshot)

    if (validation.error) return validation

    return Result.succeed(new Id(validation.value))
  }

  static make(): Id {
    const chars: string[] = []

    for (let i = 0; i < this.LENGTH; i += 1) {
      const index = Math.floor(this.ALPHABET.length * Math.random())
      chars.push(this.ALPHABET[index]!)
    }

    return new Id(chars.join(''))
  }

  private static validate(value: string): Result<string> {
    const normalized = value.trim()

    if (normalized.length !== this.LENGTH) {
      return Result.fail(new InvalidIdLengthError(this.LENGTH))
    }

    const hasIllegalChars = normalized.split('').some((char) => !this.ALPHABET_SET.has(char))

    if (hasIllegalChars) return Result.fail(new IllegalIdCharsError())

    return Result.succeed(normalized)
  }
}

export class InvalidIdLengthError extends ValidationError {
  constructor(expectedLength: number) {
    super('ID_INVALID_LENGTH', `Id length should be ${expectedLength} characters long.`, {
      expectedLength,
    })
  }
}

export class IllegalIdCharsError extends ValidationError {
  constructor() {
    super('ID_ILLEGAL_CHARS', 'Id should not contain illegal characters.')
  }
}

export type IdSnapshot = string
