import { Result, fail, succeed } from "../utils/Result"
import { Tier } from "../entities/Tier"

export class Campaign {
	private constructor(
		private name: CrowdfundingName,
		private tiers: Tiers
	) {
	}

	static make(name: string): Result<Campaign> {
		const nameResult = CrowdfundingName.make(name)
		if (nameResult.error) return nameResult

		const tiersResult = Tiers.make()
		if (tiersResult.error) return tiersResult

		return succeed(new Campaign(nameResult.value, tiersResult.value))
	}
}

class CrowdfundingName {
	private constructor(private value: string) { }

	static make(value: string): Result<CrowdfundingName> {
		value = value.trim()
		if (value.length < 3) {
			return fail(new Error("Name should be at least 3 characters long"))
		}

		return succeed(new CrowdfundingName(value))
	}
}

class Tiers {
	private constructor(private tiers: Tier[] = []) {
	}

	static make(tiers: Tier[] = []): Result<Tiers> {
		return succeed(new Tiers(tiers))
	}
}

