import { Result } from '@values/Result'

export class Money {
  protected constructor(protected value: number) {}

  isLessThan(money: Money): boolean {
    return this.value < money.value
  }

  isEqual(other: Money): boolean {
    return this.value === other.value
  }

  plus(other: Money): Money {
    return new Money(this.value + other.value)
  }

  export(): MoneyExported {
    return this.value
  }

  static import(exported: MoneyExported): Result<Money> {
    return this.make(exported)
  }

  static make(value: number): Result<Money> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Money(validation.value))
  }

  protected static validate(value: number): Result<number> {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return Result.fail(new Error('Money value should be an number.'))
    }

    return Result.succeed(value)
  }
}

export type MoneyExported = number
