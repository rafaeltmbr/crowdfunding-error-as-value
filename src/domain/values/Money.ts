import { Result } from '@values/Result'

export class Money {
  protected constructor(protected value: number) {}

  isLessThan(money: Money): boolean {
    return this.value < money.value
  }

  isEqual(other: Money): boolean {
    return this.value === other.value
  }

  export(): unknown {
    return this.value
  }

  static import(data: unknown): Result<Money> {
    if (typeof data !== 'number') {
      return Result.fail(new Error('Cannot import Money from invalid data format.'))
    }

    return this.make(data)
  }

  static make(value: number): Result<Money> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Money(validation.value))
  }

  protected static validate(value: number): Result<number> {
    if (Number.isNaN(value)) {
      return Result.fail(new Error('Money value should be an number.'))
    }

    return Result.succeed(value)
  }
}
