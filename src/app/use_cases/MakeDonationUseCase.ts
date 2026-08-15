import { CampaignRepository } from '@app/repositories/CampaignRepository'
import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Campaign } from '@entities/Campaign'
import { Exception } from '@values/Exception'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Result } from '@values/Result'

export class MakeDonationUseCase {
  constructor(
    private campaignRepository: CampaignRepository,
    private supporterRepository: SupporterRepository
  ) {}

  async execute(params: MakeDonationParams): Promise<Result<void>> {
    const supporterValidation = await this.validateSupporter(params.supporterId)
    if (supporterValidation.error) return supporterValidation

    const campaignResult = await this.findCampaign(params.campaignId)
    if (campaignResult.error) return campaignResult

    const campaign = campaignResult.value

    const makeDonationResult = campaign.makeDonation(params.amount, params.supporterId)
    if (makeDonationResult.error) return makeDonationResult

    return await this.campaignRepository.upsert(campaign)
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
    if (!campaign) return Result.fail(Exception.notFound('CAMPAIGN_NOT_FOUND', [campaignId]))

    return Result.succeed(campaign)
  }
}

export interface MakeDonationParams {
  campaignId: Id
  supporterId: Id
  amount: Money
}
