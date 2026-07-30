import { Supporter, type SupporterExported } from '@entities/Supporter'
import { Tier, type TierExported } from '@entities/Tier'
import { Money, type MoneyExported } from '@values/Money'
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

  belongsToSupporter(supporter: Supporter): boolean {
    return this.supporter.isEqual(supporter)
  }

  addTierToBucket(bucket: Set<Tier>): Set<Tier> {
    return this.tier ? new Set<Tier>([...bucket.values(), this.tier]) : bucket
  }

  addToTotal(total: Money): Money {
    return total.plus(this.amount)
  }

  export(): DonationExported {
    return {
      amount: this.amount.export(),
      supporter: this.supporter.export(),
      tier: this.tier ? this.tier.export() : null,
    }
  }

  static import(exported: DonationExported): Result<Donation> {
    const amountResult = DonationMoney.make(exported.amount)
    if (amountResult.error) return amountResult

    const supporterResult = Supporter.import(exported.supporter)
    if (supporterResult.error) return supporterResult

    const tierResult =
      exported.tier !== null ? Tier.import(exported.tier) : Result.succeed<Tier | null>(null)
    if (tierResult.error) return Result.fail(tierResult.error)

    return Result.succeed(new Donation(amountResult.value, supporterResult.value, tierResult.value))
  }

  static make(amount: Money, supporter: Supporter, tier: Tier | null = null): Result<Donation> {
    const amountExport = amount.export()

    const donationMoneyResult = DonationMoney.make(amountExport)

    if (donationMoneyResult.error) return Result.fail(donationMoneyResult.error)

    return Result.succeed(new Donation(donationMoneyResult.value, supporter, tier))
  }
}

class DonationMoney extends Money {
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

export interface DonationExported {
  amount: MoneyExported
  supporter: SupporterExported
  tier: TierExported | null
}
