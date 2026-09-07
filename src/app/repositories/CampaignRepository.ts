import { Campaign } from '@domain/campaign'
import { Id, Name, Result } from '@domain/common_values'

export interface CampaignRepository {
  upsert(campaign: Campaign): Promise<Result<void>>
  findById(id: Id): Promise<Result<Campaign | null>>
  findByName(name: Name): Promise<Result<Campaign | null>>
  delete(campaign: Campaign): Promise<Result<void>>
}
