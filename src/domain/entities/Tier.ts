import { Money } from "@values/Money";
import { Name } from "@values/Name";
import { Result } from "@values/Result";

export class Tier {
  protected constructor(
    protected name: TierName,
    protected value: TierMoney,
  ) {}

  export(): unknown {
    return {
      name: this.name.export(),
      value: this.value.export(),
    };
  }

  isValueLessThan(tier: Tier): boolean {
    return this.value.isLessThan(tier.value);
  }

  isValueEqual(tier: Tier): boolean {
    return this.value.isEqual(tier.value);
  }

  static make(name: string, value: number): Result<Tier> {
    const nameResult = TierName.make(name);
    if (nameResult.error) return nameResult;

    const valueResult = TierMoney.make(value);
    if (valueResult.error) return valueResult;

    return Result.succeed(new Tier(nameResult.value, valueResult.value));
  }
}

class TierName extends Name {
  protected constructor(value: string) {
    super(value);
  }

  static override make(value: string): Result<TierName> {
    const validation = this.validate(value);
    if (validation.error) return validation;

    return Result.succeed(new TierName(value));
  }

  protected static override validate(value: string): Result<string> {
    const baseValidation = super.validate(value);
    if (baseValidation.error) return baseValidation;

    if (baseValidation.value.length < 3) {
      return Result.fail(
        new Error("Tier name should be at least 3 characters long."),
      );
    }

    return Result.succeed(baseValidation.value);
  }
}

class TierMoney extends Money {
  protected constructor(value: number) {
    super(value);
  }

  static override make(value: number): Result<TierMoney> {
    const validation = this.validate(value);
    if (validation.error) return validation;

    return Result.succeed(new TierMoney(value));
  }

  protected static override validate(value: number): Result<number> {
    const baseValidation = super.validate(value);
    if (baseValidation.error) return baseValidation;

    if (baseValidation.value <= 0) {
      return Result.fail(new Error("Tier value should be positive."));
    }

    return Result.succeed(baseValidation.value);
  }
}
