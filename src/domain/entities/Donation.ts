import { Supporter, type SupporterSnapshot } from '@entities/Supporter'
import { Tier, type TierSnapshot } from '@entities/Tier'
import { Id, type IdSnapshot } from '@values/Id'
import { Money, type MoneySnapshot } from '@values/Money'
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

  toSnapshot(): DonationSnapshot {
    const contributionSnapshot = this.contribution.toSnapshot()
    return {
      id: this.id.toSnapshot(),
      amount: contributionSnapshot.amount,
      supporter: contributionSnapshot.supporter,
      tier: this.tier ? this.tier.toSnapshot() : null,
    }
  }

  static fromSnapshot(snapshot: DonationSnapshot): Result<Donation> {
    const idResult = Id.fromSnapshot(snapshot.id)
    if (idResult.error) return Result.fail(idResult.error)

    const contributionResult = Contribution.fromSnapshot({
      amount: snapshot.amount,
      supporter: snapshot.supporter,
    })
    if (contributionResult.error) return Result.fail(contributionResult.error)

    const tierResult =
      snapshot.tier !== null ? Tier.fromSnapshot(snapshot.tier) : Result.succeed<Tier | null>(null)
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

  toSnapshot(): ContributionSnapshot {
    return {
      amount: this.amount.toSnapshot(),
      supporter: this.supporter.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: {
    amount: MoneySnapshot
    supporter: SupporterSnapshot
  }): Result<Contribution> {
    const amountResult = DonationMoney.make(snapshot.amount)
    if (amountResult.error) return amountResult

    const supporterResult = Supporter.fromSnapshot(snapshot.supporter)
    if (supporterResult.error) return supporterResult

    return Result.succeed(new Contribution(amountResult.value, supporterResult.value))
  }

  static make(amount: Money, supporter: Supporter): Result<Contribution> {
    const amountExport = amount.toSnapshot()
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

interface ContributionSnapshot {
  amount: MoneySnapshot
  supporter: SupporterSnapshot
}

export interface DonationSnapshot {
  id: IdSnapshot
  amount: MoneySnapshot
  supporter: SupporterSnapshot
  tier: TierSnapshot | null
}
