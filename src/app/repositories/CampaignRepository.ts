import { Id } from '@common_values/Id'
import { Name } from '@common_values/Name'
import { Result } from '@common_values/Result'
import { Campaign } from '@domain/campaign'

export interface CampaignRepository {
  upsert(campaign: Campaign): Promise<Result<void>>
  findById(id: Id): Promise<Result<Campaign | null>>
  findByName(name: Name): Promise<Result<Campaign | null>>
  delete(campaign: Campaign): Promise<Result<void>>
}
