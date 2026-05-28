import { fail, Result, succeed } from "../utils/Result";

export class Tier {
	constructor(private name: Name, value: Value) { }

	static make(name: string, value: number): Result<Tier> {
		const nameResult = Name.make(name)
		if (nameResult.error) return nameResult

		const valueResult = Value.make(value)
		if (valueResult.error) return valueResult

		return succeed(new Tier(nameResult.value, valueResult.value))
	}
}

class Name {
	private constructor(private value: string) { }

	static make(value: string): Result<Name> {
		value = value.trim()
		if (value.length < 3) {
			return fail(new Error("Tier name should be at least 3 characters long"))
		}

		return succeed(new Name(value))
	}
}

class Value {
	private constructor(private value: number) { }

	static make(value: number): Result<Value> {
		if (Number.isNaN(value)) {
			return fail(new Error("Tier value should be a number."))
		}

		if (value <= 0) {
			return fail(new Error("Tier value should be a positive number."))
		}

		return succeed(new Value(value))
	}
}
