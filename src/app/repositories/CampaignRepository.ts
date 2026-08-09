import { Campaign } from '@entities/Campaign'
import { Id } from '@values/Id'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export interface CampaignRepository {
  upsert(campaign: Campaign): Promise<Result<void>>
  findById(id: Id): Promise<Result<Campaign | null>>
  findByName(name: Name): Promise<Result<Campaign | null>>
  delete(campaign: Campaign): Promise<Result<void>>
}
