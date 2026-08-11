import { ValidationError } from '@values/DomainError'
import { Id, type IdSnapshot } from '@values/Id'
import { Money, type MoneySnapshot } from '@values/Money'
import { Name, type NameSnapshot } from '@values/Name'
import { Result } from '@values/Result'

export class Tier {
  protected constructor(
    protected id: Id,
    protected name: TierName,
    protected value: TierMoney
  ) {}

  isValueLessThan(tier: Tier): boolean {
    return this.value.isLessThan(tier.value)
  }

  hasId(id: Id): boolean {
    return this.id.isEqual(id)
  }

  isValueEqual(tier: Tier): boolean {
    return this.value.isEqual(tier.value)
  }

  isValueEligible(money: Money): boolean {
    return this.value.isLessThan(money) || this.value.isEqual(money)
  }

  isEqual(tier: Tier): boolean {
    return this.id.isEqual(tier.id)
  }

  toSnapshot(): TierSnapshot {
    return {
      id: this.id.toSnapshot(),
      name: this.name.toSnapshot(),
      value: this.value.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: TierSnapshot): Result<Tier> {
    const idResult = Id.fromSnapshot(snapshot.id)
    if (idResult.error) return Result.fail(idResult.error)

    const nameResult = TierName.fromSnapshot(snapshot.name)
    if (nameResult.error) return nameResult

    const valueResult = TierMoney.fromSnapshot(snapshot.value)
    if (valueResult.error) return valueResult

    return Result.succeed(new Tier(idResult.value, nameResult.value, valueResult.value))
  }

  static make(name: string, value: number): Result<Tier> {
    const nameResult = TierName.make(name)
    if (nameResult.error) return nameResult

    const valueResult = TierMoney.make(value)
    if (valueResult.error) return valueResult

    return Result.succeed(new Tier(Id.make(), nameResult.value, valueResult.value))
  }
}

class TierName extends Name {
  protected constructor(value: string) {
    super(value)
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
      return Result.fail(new ShortTierNameError())
    }

    return Result.succeed(baseValidation.value)
  }
}

class TierMoney extends Money {
  protected constructor(value: number) {
    super(value)
  }
  static override make(value: number): Result<TierMoney> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new TierMoney(validation.value))
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value <= 0) return Result.fail(new NonPositiveTierMoneyError())

    return Result.succeed(baseValidation.value)
  }
}

class ShortTierNameError extends ValidationError {
  constructor() {
    super('TIER_NAME_MIN_LENGTH', 'TierName should be at least 3 characters long.', {
      minLength: 3,
    })
  }
}

class NonPositiveTierMoneyError extends ValidationError {
  constructor() {
    super('TIER_MONEY_NON_POSITIVE', 'TierMoney should be positive.')
  }
}

export interface TierSnapshot {
  id: IdSnapshot
  name: NameSnapshot
  value: MoneySnapshot
}
