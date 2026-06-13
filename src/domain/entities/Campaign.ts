import { Name } from "@values/Name";
import { Result } from "@values/Result";
import { Tier } from "@entities/Tier";

export class Campaign {
  protected constructor(
    protected name: CampaignName,
    protected tiers: Tiers,
  ) {}

  export(): unknown {
    return {
      name: this.name.export(),
      tiers: this.tiers.export(),
    };
  }

  static make(name: string, tiers: Tier[] = []): Result<Campaign> {
    const nameResult = CampaignName.make(name);
    if (nameResult.error) return nameResult;

    const tiersResult = Tiers.make(tiers);
    if (tiersResult.error) return tiersResult;

    return Result.succeed(new Campaign(nameResult.value, tiersResult.value));
  }
}

class CampaignName extends Name {
  protected constructor(value: string) {
    super(value);
  }

  static override make(value: string): Result<CampaignName> {
    const validation = this.validate(value);
    if (validation.error) return validation;

    return Result.succeed(new CampaignName(validation.value));
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value);
    if (baseValidation.error) return baseValidation;

    if (baseValidation.value.length < 3) {
      return Result.fail(
        new Error("Campaign name should be at least 3 characters long."),
      );
    }

    return Result.succeed(baseValidation.value);
  }
}

class Tiers {
  protected constructor(protected tiers: Tier[]) {}

  export(): unknown {
    return this.tiers.map((t) => t.export());
  }

  static make(tiers: Tier[]): Result<Tiers> {
    const validation = this.validate(tiers);
    if (validation.error) return validation;

    return Result.succeed(new Tiers(validation.value));
  }

  protected static validate(tiers: Tier[]): Result<Tier[]> {
    const sortedTiers = tiers.toSorted((a, b) =>
      a.isValueLessThan(b) ? -1 : 1,
    );

    for (let i = 0; i < sortedTiers.length - 1; i += 1) {
      if (sortedTiers[i]!.isValueEqual(sortedTiers[i + 1]!)) {
        return Result.fail(new Error("Tiers values should be unique."));
      }
    }

    return Result.succeed(sortedTiers);
  }
}
