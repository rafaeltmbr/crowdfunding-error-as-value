import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class Tier {
  protected constructor(
    protected name: TierName,
    protected value: TierMoney
  ) {}

  isValueLessThan(tier: Tier): boolean {
    return this.value.isLessThan(tier.value)
  }

  isValueEqual(tier: Tier): boolean {
    return this.value.isEqual(tier.value)
  }

  isValueEligible(money: Money): boolean {
    return this.value.isLessThan(money) || this.value.isEqual(money)
  }

  isEqual(tier: Tier): boolean {
    return this.name.isEqual(tier.name) && this.value.isEqual(tier.value)
  }

  export(): unknown {
    return {
      name: this.name.export(),
      value: this.value.export(),
    }
  }

  static import(data: unknown): Result<Tier> {
    if (typeof data !== 'object' || data === null) {
      return Result.fail(new Error('Cannot import Tier from invalid data format.'))
    }

    const nameResult = TierName.import((data as Record<string, unknown>)['name'])
    if (nameResult.error) return nameResult

    const valueResult = TierMoney.import((data as Record<string, unknown>)['value'])
    if (valueResult.error) return valueResult

    return Result.succeed(new Tier(nameResult.value, valueResult.value))
  }

  static make(name: string, value: number): Result<Tier> {
    const nameResult = TierName.make(name)
    if (nameResult.error) return nameResult

    const valueResult = TierMoney.make(value)
    if (valueResult.error) return valueResult

    return Result.succeed(new Tier(nameResult.value, valueResult.value))
  }
}

class TierName extends Name {
  static override import(data: unknown): Result<TierName> {
    if (typeof data !== 'string') {
      return Result.fail(new Error('Cannot import TierName from invalid data format.'))
    }

    return this.make(data)
  }

  static override make(value: string): Result<TierName> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new TierName(validation.value))
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value.length < 3) {
      return Result.fail(new Error('TierName should be at least 3 characters long.'))
    }

    return Result.succeed(baseValidation.value)
  }
}

class TierMoney extends Money {
  static override import(data: unknown): Result<Money> {
    if (typeof data !== 'number') {
      return Result.fail(new Error('Cannot import TierMoney from invalid data format.'))
    }

    return this.make(data)
  }

  static override make(value: number): Result<TierMoney> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new TierMoney(validation.value))
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value <= 0) {
      return Result.fail(new Error('TierMoney should be positive.'))
    }

    return Result.succeed(baseValidation.value)
  }
}
