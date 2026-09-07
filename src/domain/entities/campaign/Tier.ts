import { Exception } from '@values/Exception'
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

  static make(name: Name, value: Money): Result<Tier> {
    const nameResult = TierName.from(name)
    if (nameResult.error) return nameResult

    const valueResult = TierMoney.from(value)
    if (valueResult.error) return valueResult

    return Result.succeed(new Tier(Id.make(), nameResult.value, valueResult.value))
  }
}

class TierName extends Name {
  protected constructor(value: string) {
    super(value)
  }
  static override make(value: string): Result<TierName> {
    return Result.fail(Exception.unexpected('TIER_NAME_INVALID_FACTORY_METHOD', [value]))
  }

  static from(baseName: Name): Result<TierName> {
    const rawValue = (baseName as TierName).value
    const normalized = this.validate(rawValue)
    if (normalized.error) return normalized

    return Result.succeed(new TierName(normalized.value))
  }

  static override fromSnapshot(snapshot: string): Result<TierName> {
    const normalized = this.validate(snapshot)
    if (normalized.error) return normalized

    return Result.succeed(new TierName(normalized.value))
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value.length < 3) {
      return Result.fail(Exception.validation('TIER_NAME_MIN_LENGTH', [3]))
    }

    return Result.succeed(baseValidation.value)
  }
}

class TierMoney extends Money {
  protected constructor(value: number) {
    super(value)
  }
  static override make(value: number): Result<TierMoney> {
    return Result.fail(Exception.unexpected('TIER_MONEY_INVALID_FACTORY_METHOD', [String(value)]))
  }

  static from(baseMoney: Money): Result<TierMoney> {
    const rawValue = (baseMoney as TierMoney).value
    const normalized = this.validate(rawValue)
    if (normalized.error) return normalized

    return Result.succeed(new TierMoney(normalized.value))
  }

  static override fromSnapshot(snapshot: number): Result<TierMoney> {
    const normalized = this.validate(snapshot)
    if (normalized.error) return normalized

    return Result.succeed(new TierMoney(normalized.value))
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value <= 0) {
      return Result.fail(Exception.validation('TIER_MONEY_NON_POSITIVE'))
    }

    return Result.succeed(baseValidation.value)
  }
}

export interface TierSnapshot {
  id: IdSnapshot
  name: NameSnapshot
  value: MoneySnapshot
}
