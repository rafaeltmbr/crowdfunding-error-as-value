import { Supporter, type SupporterExported } from '@entities/Supporter'
import { Tier, type TierExported } from '@entities/Tier'
import { Id, type IdExported } from '@values/Id'
import { Money, type MoneyExported } from '@values/Money'
import { Result } from '@values/Result'

export class Donation {
  protected constructor(
    protected id: Id,
    protected contribution: Contribution,
    protected tier: Tier | null
  ) {}

  isEqual(other: Donation): boolean {
    return this.id.isEqual(other.id)
  }

  isEligibleForTier(tier: Tier): boolean {
    return this.contribution.isEligibleForTier(tier)
  }

  belongsToSupporter(supporter: Supporter): boolean {
    return this.contribution.belongsTo(supporter)
  }

  addTierToBucket(bucket: Set<Tier>): Set<Tier> {
    return this.tier ? new Set<Tier>([...bucket.values(), this.tier]) : bucket
  }

  addToTotal(total: Money): Money {
    return this.contribution.addTo(total)
  }

  export(): DonationExported {
    const contributionExported = this.contribution.export()
    return {
      id: this.id.export(),
      amount: contributionExported.amount,
      supporter: contributionExported.supporter,
      tier: this.tier ? this.tier.export() : null,
    }
  }

  static import(exported: DonationExported): Result<Donation> {
    const idResult = Id.import(exported.id)
    if (idResult.error) return Result.fail(idResult.error)

    const contributionResult = Contribution.import({
      amount: exported.amount,
      supporter: exported.supporter,
    })
    if (contributionResult.error) return Result.fail(contributionResult.error)

    const tierResult =
      exported.tier !== null ? Tier.import(exported.tier) : Result.succeed<Tier | null>(null)
    if (tierResult.error) return Result.fail(tierResult.error)

    return Result.succeed(new Donation(idResult.value, contributionResult.value, tierResult.value))
  }

  static make(amount: Money, supporter: Supporter, tier: Tier | null = null): Result<Donation> {
    const contributionResult = Contribution.make(amount, supporter)
    if (contributionResult.error) return Result.fail(contributionResult.error)

    return Result.succeed(new Donation(Id.make(), contributionResult.value, tier))
  }
}

class Contribution {
  protected constructor(
    protected amount: DonationMoney,
    protected supporter: Supporter
  ) {}

  isEligibleForTier(tier: Tier): boolean {
    return tier.isValueEligible(this.amount)
  }

  belongsTo(supporter: Supporter): boolean {
    return this.supporter.isEqual(supporter)
  }

  addTo(total: Money): Money {
    return total.plus(this.amount)
  }

  export(): ContributionExported {
    return {
      amount: this.amount.export(),
      supporter: this.supporter.export(),
    }
  }

  static import(exported: {
    amount: MoneyExported
    supporter: SupporterExported
  }): Result<Contribution> {
    const amountResult = DonationMoney.make(exported.amount)
    if (amountResult.error) return amountResult

    const supporterResult = Supporter.import(exported.supporter)
    if (supporterResult.error) return supporterResult

    return Result.succeed(new Contribution(amountResult.value, supporterResult.value))
  }

  static make(amount: Money, supporter: Supporter): Result<Contribution> {
    const amountExport = amount.export()
    const donationMoneyResult = DonationMoney.make(amountExport)
    if (donationMoneyResult.error) return Result.fail(donationMoneyResult.error)

    return Result.succeed(new Contribution(donationMoneyResult.value, supporter))
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

interface ContributionExported {
  amount: MoneyExported
  supporter: SupporterExported
}

export interface DonationExported {
  id: IdExported
  amount: MoneyExported
  supporter: SupporterExported
  tier: TierExported | null
}
