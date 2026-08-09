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

  belongsToSupporter(supporterId: Id): boolean {
    return this.contribution.belongsTo(supporterId)
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
      supporterId: contributionSnapshot.supporterId,
      tier: this.tier ? this.tier.toSnapshot() : null,
    }
  }

  static fromSnapshot(snapshot: DonationSnapshot): Result<Donation> {
    const idResult = Id.fromSnapshot(snapshot.id)
    if (idResult.error) return Result.fail(idResult.error)

    const contributionResult = Contribution.fromSnapshot({
      amount: snapshot.amount,
      supporterId: snapshot.supporterId,
    })
    if (contributionResult.error) return Result.fail(contributionResult.error)

    const tierResult =
      snapshot.tier !== null ? Tier.fromSnapshot(snapshot.tier) : Result.succeed<Tier | null>(null)
    if (tierResult.error) return Result.fail(tierResult.error)

    return Result.succeed(new Donation(idResult.value, contributionResult.value, tierResult.value))
  }

  static make(amount: Money, supporterId: Id, tier: Tier | null = null): Result<Donation> {
    const contributionResult = Contribution.make(amount, supporterId)
    if (contributionResult.error) return Result.fail(contributionResult.error)

    return Result.succeed(new Donation(Id.make(), contributionResult.value, tier))
  }
}

class Contribution {
  protected constructor(
    protected amount: DonationMoney,
    protected supporterId: Id
  ) {}

  isEligibleForTier(tier: Tier): boolean {
    return tier.isValueEligible(this.amount)
  }

  belongsTo(supporterId: Id): boolean {
    return this.supporterId.isEqual(supporterId)
  }

  addTo(total: Money): Money {
    return total.plus(this.amount)
  }

  toSnapshot(): ContributionSnapshot {
    return {
      amount: this.amount.toSnapshot(),
      supporterId: this.supporterId.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: {
    amount: MoneySnapshot
    supporterId: IdSnapshot
  }): Result<Contribution> {
    const amountResult = DonationMoney.fromSnapshot(snapshot.amount)
    if (amountResult.error) return amountResult

    const supporterIdResult = Id.fromSnapshot(snapshot.supporterId)
    if (supporterIdResult.error) return supporterIdResult

    return Result.succeed(new Contribution(amountResult.value, supporterIdResult.value))
  }

  static make(amount: Money, supporterId: Id): Result<Contribution> {
    const amountExport = amount.toSnapshot()
    const donationMoneyResult = DonationMoney.make(amountExport)
    if (donationMoneyResult.error) return Result.fail(donationMoneyResult.error)

    return Result.succeed(new Contribution(donationMoneyResult.value, supporterId))
  }
}

class DonationMoney extends Money {
  protected constructor(value: number) {
    super(value)
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

interface ContributionSnapshot {
  amount: MoneySnapshot
  supporterId: IdSnapshot
}

export interface DonationSnapshot {
  id: IdSnapshot
  amount: MoneySnapshot
  supporterId: IdSnapshot
  tier: TierSnapshot | null
}
