import { CampaignRepository } from '@app/repositories/CampaignRepository'
import { Exception } from '@common_values/Exception'
import { Id } from '@common_values/Id'
import { Money } from '@common_values/Money'
import { Name } from '@common_values/Name'
import { Result } from '@common_values/Result'
import { Campaign } from '@domain/campaign'

export interface CreateCampaignTierParams {
  name: Name
  value: Money
}

export interface CreateCampaignParams {
  name: Name
  tiers: CreateCampaignTierParams[]
}

export class CreateCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  public async execute(params: CreateCampaignParams): Promise<Result<Id>> {
    const uniquenessResult = await this.validateNameUniqueness(params.name)
    if (uniquenessResult.error) return uniquenessResult

    const campaignResult = Campaign.make(params.name)
    if (campaignResult.error) return campaignResult

    const tiersResult = this.populateTiers(campaignResult.value, params.tiers)
    if (tiersResult.error) return tiersResult

    const persistenceResult = await this.campaignRepository.upsert(campaignResult.value)
    if (persistenceResult.error) return persistenceResult

    return Result.succeed(campaignResult.value.id)
  }

  private async validateNameUniqueness(name: Name): Promise<Result<void>> {
    const duplicateResult = await this.campaignRepository.findByName(name)
    if (duplicateResult.error) return duplicateResult

    if (duplicateResult.value) {
      return Result.fail(Exception.validation('CAMPAIGN_NAME_ALREADY_EXISTS', [name]))
    }

    return Result.succeed()
  }

  private populateTiers(campaign: Campaign, tiers: CreateCampaignTierParams[]): Result<void> {
    const results = tiers.map((tier) => campaign.makeTier(tier.name, tier.value))
    const firstError = results.find((r) => r.error)
    if (firstError) return firstError

    return Result.succeed()
  }
}
