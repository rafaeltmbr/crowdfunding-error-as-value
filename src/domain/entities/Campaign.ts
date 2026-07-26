import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
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

  makeDonation(value: Money, supporter: Supporter): Result<void> {
    return this.funding.makeDonation(value, supporter)
  }

  supporterDonationStats(supporter: Supporter): SupporterDonationStats {
    return this.funding.supporterDonationStats(supporter)
  }

  isEqual(other: Campaign): boolean {
    return this.id.isEqual(other.id)
  }

  export(): unknown {
    return {
      id: this.id.export(),
      name: this.name.export(),
      funding: this.funding.export(),
    }
  }

  static import(data: unknown): Result<Campaign> {
    if (typeof data !== 'object' || data === null) {
      return Result.fail(new Error('Cannot import Campaign from invalid data format.'))
    }

    const rec = data as Record<string, unknown>

    const idResult = Id.import(rec['id'] as { value: string })
    if (idResult.error) return Result.fail(idResult.error)

    const nameResult = CampaignName.import(rec['name'])
    if (nameResult.error) return nameResult

    const fundingResult = CampaignFunding.import(rec['funding'])
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

  makeDonation(value: Money, supporter: Supporter): Result<void> {
    const tier = this.tiers.findEligibleForValue(value)
    const donationResult = Donation.make(value, supporter, tier)

    if (donationResult.error) return donationResult

    this.donations.add(donationResult.value)

    return Result.succeed()
  }

  supporterDonationStats(supporter: Supporter): SupporterDonationStats {
    return this.donations.supporterStats(supporter)
  }

  export(): unknown {
    return {
      tiers: this.tiers.export(),
      donations: this.donations.export(),
    }
  }

  static import(data: unknown): Result<CampaignFunding> {
    if (typeof data !== 'object' || data === null) {
      return Result.fail(new Error('Cannot import CampaignFunding from invalid data format.'))
    }

    const rec = data as Record<string, unknown>

    const tiersResult = Tiers.import(rec['tiers'])
    if (tiersResult.error) return tiersResult

    const donationsResult = Donations.import(rec['donations'])
    if (donationsResult.error) return donationsResult

    return Result.succeed(new CampaignFunding(tiersResult.value, donationsResult.value))
  }

  static make(tiers: Tiers, donations: Donations): CampaignFunding {
    return new CampaignFunding(tiers, donations)
  }
}

class CampaignName extends Name {
  static override import(data: unknown): Result<CampaignName> {
    if (typeof data !== 'string') {
      return Result.fail(new Error('Cannot import CampaignName from invalid data format.'))
    }

    return this.make(data)
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

  export(): unknown {
    return this.tiers.map((t) => t.export())
  }

  static import(data: unknown): Result<Tiers> {
    if (!Array.isArray(data)) {
      return Result.fail(new Error('Cannot import Tiers from invalid data format.'))
    }

    const results = data.map((tierData) => Tier.import(tierData))
    const errorResult = results.find((r) => r.error)

    if (errorResult && errorResult.error) {
      return Result.fail(errorResult.error)
    }

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

    if (hasDuplicates) {
      return Result.fail(new Error('Tiers values should be unique.'))
    }

    return Result.succeed(sortedTiers)
  }
}

class Donations {
  protected constructor(protected list: Donation[] = []) {}

  add(donation: Donation): void {
    this.list.push(donation)
  }

  supporterStats(supporter: Supporter): SupporterDonationStats {
    const donations = this.list.filter((donation) => donation.belongsToSupporter(supporter))
    return new SupporterDonationStats(donations)
  }

  export(): unknown {
    return this.list.map((d) => d.export())
  }

  static import(data: unknown): Result<Donations> {
    if (!Array.isArray(data)) {
      return Result.fail(new Error('Cannot import Donations from invalid data format.'))
    }

    const results = data.map((donationData) => Donation.import(donationData))
    const errorResult = results.find((r) => r.error)

    if (errorResult && errorResult.error) {
      return Result.fail(errorResult.error)
    }

    const donations = results.map((r) => r.value!)
    return Result.succeed(this.make(donations))
  }

  static make(list: Donation[] = []): Donations {
    return new Donations(list)
  }
}

class SupporterDonationStats {
  constructor(protected donations: Donation[]) {}

  get total(): Money {
    return this.donations.reduce(
      (total, donation) => donation.addToTotal(total),
      Money.make(0).value!
    )
  }

  get tiers(): Set<Tier> {
    return this.donations.reduce(
      (bucket, donation) => donation.addTierToBucket(bucket),
      new Set<Tier>()
    )
  }
}
