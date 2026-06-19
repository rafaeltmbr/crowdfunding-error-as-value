import { Tier } from '@entities/Tier'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class Campaign {
  protected constructor(
    protected name: CampaignName,
    protected tiers: Tiers
  ) {}

  addTier(tier: Tier): Result<void> {
    return this.tiers.add(tier)
  }

  isEqual(other: Campaign): boolean {
    return this.name.isEqual(other.name) && this.tiers.isEqual(other.tiers)
  }

  export(): unknown {
    return {
      name: this.name.export(),
      tiers: this.tiers.export(),
    }
  }

  static import(data: unknown): Result<Campaign> {
    if (typeof data !== 'object' || data === null) {
      return Result.fail(new Error('Cannot import Campaign from invalid data format.'))
    }

    const nameResult = CampaignName.import((data as Record<string, unknown>)['name'])
    if (nameResult.error) return nameResult

    const tiersResult = Tiers.import((data as Record<string, unknown>)['tiers'])
    if (tiersResult.error) return tiersResult

    return Result.succeed(new Campaign(nameResult.value, tiersResult.value))
  }

  static make(name: string, tiers: Tier[] = []): Result<Campaign> {
    const nameResult = CampaignName.make(name)
    if (nameResult.error) return nameResult

    const tiersResult = Tiers.make(tiers)
    if (tiersResult.error) return tiersResult

    return Result.succeed(new Campaign(nameResult.value, tiersResult.value))
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

  isEqual(other: Tiers): boolean {
    if (this.tiers.length !== other.tiers.length) return false

    return this.tiers.every((tier, index) => tier.isEqual(other.tiers[index]!))
  }

  export(): unknown {
    return this.tiers.map((t) => t.export())
  }

  static import(data: unknown): Result<Tiers> {
    if (!Array.isArray(data)) {
      return Result.fail(new Error('Cannot import Tiers from invalid data format.'))
    }

    const tiers: Tier[] = []
    for (const tierData of data) {
      const tierResult = Tier.import(tierData)
      if (tierResult.error) {
        return Result.fail(tierResult.error)
      }

      tiers.push(tierResult.value!)
    }

    return this.make(tiers)
  }

  static make(tiers: Tier[]): Result<Tiers> {
    const validation = this.validate(tiers)
    if (validation.error) return validation

    return Result.succeed(new Tiers(validation.value))
  }

  protected static validate(tiers: Tier[]): Result<Tier[]> {
    const sortedTiers = tiers.toSorted((a, b) => (a.isValueLessThan(b) ? -1 : 1))

    for (let i = 0; i < sortedTiers.length - 1; i += 1) {
      if (sortedTiers[i]!.isValueEqual(sortedTiers[i + 1]!)) {
        return Result.fail(new Error('Tiers values should be unique.'))
      }
    }

    return Result.succeed(sortedTiers)
  }
}
