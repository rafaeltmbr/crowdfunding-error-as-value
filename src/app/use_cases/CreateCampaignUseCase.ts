import { CampaignRepository } from '@app/repositories/CampaignRepository'
import { Campaign } from '@entities/Campaign'
import { Tier } from '@entities/Tier'
import { Exception } from '@values/Exception'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class CreateCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  public async execute(name: Name, tiers: Tier[]): Promise<Result<void>> {
    const duplicateResult = await this.campaignRepository.findByName(name)
    if (duplicateResult.error) return duplicateResult

    if (duplicateResult.value) {
      return Result.fail(Exception.validation('CAMPAIGN_NAME_ALREADY_EXISTS', [name]))
    }

    const campaignResult = Campaign.make(name, tiers)
    if (campaignResult.error) return campaignResult

    return this.campaignRepository.upsert(campaignResult.value)
  }
}
