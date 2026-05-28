import { Result } from "@utils/Result";

export class Tier {
  constructor(
    private name: Name,
    private value: Value,
  ) {}

  static make(name: string, value: number): Result<Tier> {
    const nameResult = Name.make(name);
    if (nameResult.error) return nameResult;

    const valueResult = Value.make(value);
    if (valueResult.error) return valueResult;

    return Result.succeed(new Tier(nameResult.value, valueResult.value));
  }
}

class Name {
  private constructor(private value: string) {}

  static make(value: string): Result<Name> {
    if (value.length < 3) {
      return Result.fail(
        new Error("Tier name should be at least 3 characters long"),
      );
    }

    return Result.succeed(new Name(value));
  }
}

class Value {
  private constructor(private value: number) {}

  static make(value: number): Result<Value> {
    if (isNaN(value)) {
      return Result.fail(new Error("Tier value should be a number."));
    }

    if (value <= 0) {
      return Result.fail(new Error("Tier value should be a positive number."));
    }

    return Result.succeed(new Value(value));
  }
}
