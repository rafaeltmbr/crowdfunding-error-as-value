import { DonationRepository } from '@app/repositories/DonationRepository'
import { Donation, type DonationSnapshot } from '@entities/Donation'
import { Id } from '@values/Id'
import { Result } from '@values/Result'

export class DonationRepositoryInMemory implements DonationRepository {
  private collection: DonationSnapshot[] = []

  private parseSnapshot(snapshot: DonationSnapshot, acc: Result<Donation[]>): Result<Donation[]> {
    if (acc.error) return acc

    const result = Donation.fromSnapshot(snapshot)
    if (result.error) return Result.fail(result.error)

    acc.value.push(result.value)
    return acc
  }

  private hydrateAll(): Result<Donation[]> {
    return this.collection.reduce<Result<Donation[]>>(
      (acc, snapshot) => this.parseSnapshot(snapshot, acc),
      Result.succeed([])
    )
  }

  async upsert(donation: Donation): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((d) => d.isEqual(donation))
    if (index >= 0) {
      this.collection.splice(index, 1, donation.toSnapshot())
      return Result.succeed()
    }

    this.collection.push(donation.toSnapshot())
    return Result.succeed()
  }

  async findById(id: Id): Promise<Result<Donation | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((d) => d.hasId(id)) ?? null

    return Result.succeed(found)
  }

  async findBySupporterId(supporterId: Id): Promise<Result<Donation | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((d) => d.belongsToSupporterId(supporterId)) ?? null

    return Result.succeed(found)
  }

  async delete(donation: Donation): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((d) => d.isEqual(donation))
    if (index < 0) return Result.fail(new Error('Donation does not exist.'))

    this.collection.splice(index, 1)
    return Result.succeed()
  }
}
