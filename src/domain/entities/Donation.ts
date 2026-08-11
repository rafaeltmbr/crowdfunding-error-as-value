import { Tier, type TierSnapshot } from '@entities/Tier'
import { Exception } from '@values/Exception'
import { Id, type IdSnapshot } from '@values/Id'
import { Money, type MoneySnapshot } from '@values/Money'
import { Result } from '@values/Result'

export class Donation {
  protected constructor(
    protected _id: Id,
    protected contribution: Contribution,
    protected tier: Tier | null
  ) {}

  get id(): Id {
    return this._id
  }

  isEqual(other: Donation): boolean {
    return this._id.isEqual(other._id)
  }

  isEligibleForTier(tier: Tier): boolean {
    return this.contribution.isEligibleForTier(tier)
  }

  belongsToSupporterId(supporterId: Id): boolean {
    return this.contribution.belongsTo(supporterId)
  }

  hasId(id: Id): boolean {
    return this._id.isEqual(id)
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
      id: this._id.toSnapshot(),
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
    const donationMoneyResult = DonationMoney.from(amount)
    if (donationMoneyResult.error) return donationMoneyResult

    return Result.succeed(new Contribution(donationMoneyResult.value, supporterId))
  }
}

class DonationMoney extends Money {
  protected constructor(value: number) {
    super(value)
  }
  static override make(value: number): Result<DonationMoney> {
    return Result.fail(
      Exception.unexpected('DONATION_MONEY_INVALID_FACTORY_METHOD', [String(value)])
    )
  }

  static from(baseMoney: Money): Result<DonationMoney> {
    const rawValue = (baseMoney as DonationMoney).value
    const normalized = this.validate(rawValue)
    if (normalized.error) return normalized

    return Result.succeed(new DonationMoney(normalized.value))
  }

  static override fromSnapshot(snapshot: number): Result<DonationMoney> {
    const normalized = this.validate(snapshot)
    if (normalized.error) return normalized

    return Result.succeed(new DonationMoney(normalized.value))
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value)

    if (baseValidation.error) return baseValidation

    if (baseValidation.value <= 0) {
      return Result.fail(Exception.validation('DONATION_MONEY_NON_POSITIVE'))
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
