import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { Money } from '@values/Money'
import { Result } from '@values/Result'

export class Donation {
  protected constructor(
    protected amount: DonationMoney,
    protected supporter: Supporter,
    protected tier: Tier | null
  ) {}

  isEqual(other: Donation): boolean {
    const tiersEqual =
      (this.tier === null && other.tier === null) ||
      (this.tier !== null && other.tier !== null && this.tier.isEqual(other.tier))

    return (
      this.amount.isEqual(other.amount) && this.supporter.isEqual(other.supporter) && tiersEqual
    )
  }

  isEligibleForTier(tier: Tier): boolean {
    return tier.isValueEligible(this.amount)
  }

  export(): unknown {
    return {
      amount: this.amount.export(),
      supporter: this.supporter.export(),
      tier: this.tier ? this.tier.export() : null,
    }
  }

  // eslint-disable-next-line max-statements
  static import(data: unknown): Result<Donation> {
    if (typeof data !== 'object' || data === null) {
      return Result.fail(new Error('Cannot import Donation from invalid data format.'))
    }

    const rec = data as Record<string, unknown>

    const amountResult = DonationMoney.import(rec['amount'])
    if (amountResult.error) return amountResult

    const supporterResult = Supporter.import(rec['supporter'])
    if (supporterResult.error) return supporterResult

    const tierData = rec['tier'] ?? null
    const tierResult = tierData !== null ? Tier.import(tierData) : Result.succeed<Tier | null>(null)
    if (tierResult.error) return Result.fail(tierResult.error)

    return Result.succeed(new Donation(amountResult.value, supporterResult.value, tierResult.value))
  }

  static make(amount: Money, supporter: Supporter, tier: Tier | null = null): Result<Donation> {
    const amountExport = amount.export()

    if (typeof amountExport !== 'number') {
      return Result.fail(new Error('Cannot import DonationMoney from invalid data format.'))
    }

    const donationMoneyResult = DonationMoney.make(amountExport)

    if (donationMoneyResult.error) return Result.fail(donationMoneyResult.error)

    return Result.succeed(new Donation(donationMoneyResult.value, supporter, tier))
  }
}

class DonationMoney extends Money {
  static override import(data: unknown): Result<Money> {
    if (typeof data !== 'number') {
      return Result.fail(new Error('Cannot import DonationMoney from invalid data format.'))
    }

    return this.make(data)
  }

  static override make(value: number): Result<DonationMoney> {
    const validation = this.validate(value)

    if (validation.error) return validation

    return Result.succeed(new DonationMoney(validation.value))
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value)

    if (baseValidation.error) return baseValidation

    if (baseValidation.value <= 0) {
      return Result.fail(new Error('DonationMoney should be positive.'))
    }

    return Result.succeed(baseValidation.value)
  }
}
