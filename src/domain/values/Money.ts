import { Exception } from '@values/Exception'
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

  toSnapshot(): MoneySnapshot {
    return this.value
  }

  static fromSnapshot(snapshot: MoneySnapshot): Result<Money> {
    return this.make(snapshot)
  }

  static make(value: number): Result<Money> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new Money(validation.value))
  }

  protected static validate(value: number): Result<number> {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return Result.fail(Exception.validation('MONEY_INVALID_VALUE'))
    }

    return Result.succeed(value)
  }
}

export type MoneySnapshot = number
