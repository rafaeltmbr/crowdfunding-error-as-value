import { Name } from "@values/Name";
import { Result } from "@values/Result";
import { Tier } from "@entities/Tier";

export class Campaign {
  private constructor(
    private name: CampaignName,
    private tiers: Tiers,
  ) {}

  export(): unknown {
    return {
      name: this.name.export(),
      tiers: this.tiers.export(),
    };
  }

  static make(name: string): Result<Campaign> {
    const nameResult = CampaignName.make(name);
    if (nameResult.error) return nameResult;

    const tiersResult = Tiers.make();
    if (tiersResult.error) return tiersResult;

    return Result.succeed(new Campaign(nameResult.value, tiersResult.value));
  }
}

class CampaignName extends Name {
  private constructor(value: string) {
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
  private constructor(private tiers: Tier[]) {}

  export(): unknown {
    return this.tiers.map((t) => t.export());
  }

  static make(tiers: Tier[] = []): Result<Tiers> {
    return Result.succeed(new Tiers(tiers));
  }
}
