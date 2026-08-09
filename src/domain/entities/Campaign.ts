import { Donation, type DonationSnapshot } from '@entities/Donation'
import { Tier, type TierSnapshot } from '@entities/Tier'
import { Id, type IdSnapshot } from '@values/Id'
import { Money } from '@values/Money'
import { Name, type NameSnapshot } from '@values/Name'
import { Result } from '@values/Result'

export class Campaign {
  protected constructor(
    protected id: Id,
    protected name: CampaignName,
    protected funding: CampaignFunding
  ) {}

  addTier(tier: Tier): Result<void> {
    return this.funding.addTier(tier)
  }

  makeDonation(value: Money, supporterId: Id): Result<void> {
    return this.funding.makeDonation(value, supporterId)
  }

  supporterDonationStats(supporterId: Id): SupporterDonationStats {
    return this.funding.supporterDonationStats(supporterId)
  }

  isEqual(other: Campaign): boolean {
    return this.id.isEqual(other.id)
  }

  toSnapshot(): CampaignSnapshot {
    return {
      id: this.id.toSnapshot(),
      name: this.name.toSnapshot(),
      funding: this.funding.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: CampaignSnapshot): Result<Campaign> {
    const idResult = Id.fromSnapshot(snapshot.id)
    if (idResult.error) return Result.fail(idResult.error)

    const nameResult = CampaignName.fromSnapshot(snapshot.name)
    if (nameResult.error) return nameResult

    const fundingResult = CampaignFunding.fromSnapshot(snapshot.funding)
    if (fundingResult.error) return fundingResult

    return Result.succeed(new Campaign(idResult.value, nameResult.value, fundingResult.value))
  }

  static make(name: string, tiers: Tier[] = []): Result<Campaign> {
    const nameResult = CampaignName.make(name)
    if (nameResult.error) return nameResult

    const tiersResult = Tiers.make(tiers)
    if (tiersResult.error) return tiersResult

    const funding = CampaignFunding.make(tiersResult.value, Donations.make())

    return Result.succeed(new Campaign(Id.make(), nameResult.value, funding))
  }
}

class CampaignFunding {
  protected constructor(
    protected tiers: Tiers,
    protected donations: Donations
  ) {}

  addTier(tier: Tier): Result<void> {
    return this.tiers.add(tier)
  }

  makeDonation(value: Money, supporterId: Id): Result<void> {
    const tier = this.tiers.findEligibleForValue(value)
    const donationResult = Donation.make(value, supporterId, tier)

    if (donationResult.error) return donationResult

    this.donations.add(donationResult.value)

    return Result.succeed()
  }

  supporterDonationStats(supporterId: Id): SupporterDonationStats {
    return this.donations.supporterStats(supporterId)
  }

  toSnapshot(): CampaignFundingSnapshot {
    return {
      tiers: this.tiers.toSnapshot(),
      donations: this.donations.toSnapshot(),
    }
  }

  static fromSnapshot(snapshot: CampaignFundingSnapshot): Result<CampaignFunding> {
    const tiersResult = Tiers.fromSnapshot(snapshot.tiers)
    if (tiersResult.error) return tiersResult

    const donationsResult = Donations.fromSnapshot(snapshot.donations)
    if (donationsResult.error) return donationsResult

    return Result.succeed(new CampaignFunding(tiersResult.value, donationsResult.value))
  }

  static make(tiers: Tiers, donations: Donations): CampaignFunding {
    return new CampaignFunding(tiers, donations)
  }
}

class CampaignName extends Name {
  protected constructor(value: string) {
    super(value)
  }
  static override make(value: string): Result<CampaignName> {
    const validation = this.validate(value)
    if (validation.error) return validation

    return Result.succeed(new CampaignName(validation.value))
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value)
    if (baseValidation.error) return baseValidation

    if (baseValidation.value.length < 3) {
      return Result.fail(new Error('Campaign name should be at least 3 characters long.'))
    }

    return baseValidation
  }
}

class Tiers {
  protected constructor(protected tiers: Tier[]) {}

  add(tier: Tier): Result<void> {
    const validation = Tiers.validate([...this.tiers, tier])
    if (validation.error) return validation

    this.tiers = validation.value
    return Result.succeed()
  }

  findEligibleForValue(value: Money): Tier | null {
    return this.tiers.toReversed().find((t) => t.isValueEligible(value)) ?? null
  }

  toSnapshot(): TierSnapshot[] {
    return this.tiers.map((t) => t.toSnapshot())
  }

  static fromSnapshot(snapshot: TierSnapshot[]): Result<Tiers> {
    const results = snapshot.map((tierData) => Tier.fromSnapshot(tierData))
    const errorResult = results.find((r) => r.error)

    if (errorResult && errorResult.error) return Result.fail(errorResult.error)

    const tiers = results.map((r) => r.value!)

    return this.make(tiers)
  }

  static make(tiers: Tier[]): Result<Tiers> {
    const validation = this.validate(tiers)
    if (validation.error) return validation

    return Result.succeed(new Tiers(validation.value))
  }

  protected static validate(tiers: Tier[]): Result<Tier[]> {
    const sortedTiers = tiers.toSorted((a, b) => (a.isValueLessThan(b) ? -1 : 1))

    const hasDuplicates = sortedTiers.some(
      (tier, i) => i < sortedTiers.length - 1 && tier.isValueEqual(sortedTiers[i + 1]!)
    )

    if (hasDuplicates) return Result.fail(new Error('Tiers values should be unique.'))

    return Result.succeed(sortedTiers)
  }
}

class Donations {
  protected constructor(protected list: Donation[] = []) {}

  add(donation: Donation): void {
    this.list.push(donation)
  }

  supporterStats(supporterId: Id): SupporterDonationStats {
    const donations = this.list.filter((donation) => donation.belongsToSupporter(supporterId))
    return new SupporterDonationStats(donations)
  }

  toSnapshot(): DonationSnapshot[] {
    return this.list.map((d) => d.toSnapshot())
  }

  static fromSnapshot(snapshot: DonationSnapshot[]): Result<Donations> {
    const results = snapshot.map((donationData) => Donation.fromSnapshot(donationData))
    const errorResult = results.find((r) => r.error)

    if (errorResult && errorResult.error) return Result.fail(errorResult.error)

    const donations = results.map((r) => r.value!)
    return Result.succeed(this.make(donations))
  }

  static make(list: Donation[] = []): Donations {
    return new Donations(list)
  }
}

class SupporterDonationStats {
  private cachedTotal: Money | null = null
  private cachedTiers: Set<Tier> | null = null

  constructor(protected donations: Donation[]) {}

  calculateTotal(): Money {
    if (this.cachedTotal !== null) return this.cachedTotal

    return (this.cachedTotal = this.donations.reduce(
      (total, donation) => donation.addToTotal(total),
      Money.make(0).value!
    ))
  }

  extractTiers(): Set<Tier> {
    if (this.cachedTiers !== null) return this.cachedTiers

    return (this.cachedTiers = this.donations.reduce(
      (bucket, donation) => donation.addTierToBucket(bucket),
      new Set<Tier>()
    ))
  }
}

export interface CampaignFundingSnapshot {
  tiers: TierSnapshot[]
  donations: DonationSnapshot[]
}

export interface CampaignSnapshot {
  id: IdSnapshot
  name: NameSnapshot
  funding: CampaignFundingSnapshot
}
