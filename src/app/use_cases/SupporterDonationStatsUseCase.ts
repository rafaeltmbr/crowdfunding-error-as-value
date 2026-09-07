import { CampaignRepository } from '@app/repositories/CampaignRepository'
import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Campaign, SupporterDonationStats } from '@domain/campaign'
import { Exception, Id, Result } from '@domain/common_values'

export interface SupporterDonationStatsParams {
  campaignId: Id
  supporterId: Id
}

export class SupporterDonationStatsUseCase {
  constructor(
    private campaignRepository: CampaignRepository,
    private supporterRepository: SupporterRepository
  ) {}

  async execute(params: SupporterDonationStatsParams): Promise<Result<SupporterDonationStats>> {
    const supporterValidation = await this.validateSupporter(params.supporterId)
    if (supporterValidation.error) return supporterValidation

    const campaignResult = await this.findCampaign(params.campaignId)
    if (campaignResult.error) return campaignResult

    const campaign = campaignResult.value

    return Result.succeed(campaign.supporterDonationStats(params.supporterId))
  }

  private async validateSupporter(supporterId: Id): Promise<Result<void>> {
    const supporterResult = await this.supporterRepository.findById(supporterId)
    if (supporterResult.error) return supporterResult

    const supporter = supporterResult.value
    if (!supporter) {
      return Result.fail(Exception.notFound('SUPPORTER_NOT_FOUND', [supporterId]))
    }

    return Result.succeed()
  }

  private async findCampaign(campaignId: Id): Promise<Result<Campaign>> {
    const campaignResult = await this.campaignRepository.findById(campaignId)
    if (campaignResult.error) return campaignResult

    const campaign = campaignResult.value
    if (!campaign) {
      return Result.fail(Exception.notFound('CAMPAIGN_NOT_FOUND', [campaignId]))
    }

    return Result.succeed(campaign)
  }
}
