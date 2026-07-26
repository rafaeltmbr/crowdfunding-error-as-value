import { Result } from './Result'

export class Id {
  protected static ALPHABET: Readonly<string> = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  protected static ALPHABET_SET: ReadonlySet<string> = new Set(this.ALPHABET.split(''))
  protected static LENGTH: Readonly<number> = 10

  protected constructor(protected value: string) {}

  isEqual(other: Id): boolean {
    return this.value === other.value
  }

  export(): IdDto {
    return { value: this.value }
  }

  static import(dto: IdDto): Result<Id> {
    const validation = this.validate(dto.value)

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
      return Result.fail(new Error(`Id length should be ${this.LENGTH} characters long.`))
    }

    const hasIllegalChars = normalized.split('').some((char) => !this.ALPHABET_SET.has(char))

    if (hasIllegalChars) {
      return Result.fail(new Error('Id should not contain illegal characters.'))
    }

    return Result.succeed(normalized)
  }
}

export interface IdDto {
  value: string
}
