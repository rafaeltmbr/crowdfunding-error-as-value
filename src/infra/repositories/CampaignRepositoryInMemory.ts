import { CampaignRepository } from '@app/repositories/CampaignRepository'
import { Campaign, type CampaignSnapshot } from '@entities/Campaign'
import { Id } from '@values/Id'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class CampaignRepositoryInMemory implements CampaignRepository {
  private collection: CampaignSnapshot[] = []

  private parseSnapshot(snapshot: CampaignSnapshot, acc: Result<Campaign[]>): Result<Campaign[]> {
    if (acc.error) return acc

    const result = Campaign.fromSnapshot(snapshot)
    if (result.error) return Result.fail(result.error)

    acc.value.push(result.value)
    return acc
  }

  private hydrateAll(): Result<Campaign[]> {
    return this.collection.reduce<Result<Campaign[]>>(
      (acc, snapshot) => this.parseSnapshot(snapshot, acc),
      Result.succeed([])
    )
  }

  async upsert(campaign: Campaign): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((c) => c.isEqual(campaign))
    if (index >= 0) {
      this.collection.splice(index, 1, campaign.toSnapshot())
      return Result.succeed()
    }

    this.collection.push(campaign.toSnapshot())
    return Result.succeed()
  }

  async findById(id: Id): Promise<Result<Campaign | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((c) => c.hasId(id)) ?? null

    return Result.succeed(found)
  }

  async findByName(name: Name): Promise<Result<Campaign | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((c) => c.hasName(name)) ?? null

    return Result.succeed(found)
  }

  async delete(campaign: Campaign): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((c) => c.isEqual(campaign))
    if (index < 0) return Result.fail(new Error('Campaign does not exist.'))

    this.collection.splice(index, 1)
    return Result.succeed()
  }
}
