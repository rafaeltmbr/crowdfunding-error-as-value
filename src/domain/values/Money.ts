import { Result } from "@values/Result";

export class Money {
  protected constructor(private value: number) {}

  export(): unknown {
    return this.value;
  }

  static make(value: number): Result<Money> {
    const validation = this.validate(value);
    if (validation.error) return validation;

    return Result.succeed(new Money(validation.value));
  }

  protected static validate(value: number): Result<number> {
    if (Number.isNaN(value)) {
      return Result.fail(new Error("Money value should be an number."));
    }

    if (value < 0) {
      return Result.fail(new Error("Money value should not be negative."));
    }

    return Result.succeed(value);
  }
}
