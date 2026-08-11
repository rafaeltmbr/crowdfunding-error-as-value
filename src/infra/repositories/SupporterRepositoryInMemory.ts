import { SupporterRepository } from '@app/repositories/SupporterRepository'
import { Supporter, type SupporterSnapshot } from '@entities/Supporter'
import { Email } from '@values/Email'
import { Exception } from '@values/Exception'
import { Id } from '@values/Id'
import { Result } from '@values/Result'

export class SupporterRepositoryInMemory implements SupporterRepository {
  private collection: SupporterSnapshot[] = []

  private parseSnapshot(
    snapshot: SupporterSnapshot,
    acc: Result<Supporter[]>
  ): Result<Supporter[]> {
    if (acc.error) return acc

    const result = Supporter.fromSnapshot(snapshot)
    if (result.error) return Result.fail(result.error)

    acc.value.push(result.value)
    return acc
  }

  private hydrateAll(): Result<Supporter[]> {
    return this.collection.reduce<Result<Supporter[]>>(
      (acc, snapshot) => this.parseSnapshot(snapshot, acc),
      Result.succeed([])
    )
  }

  async upsert(supporter: Supporter): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((s) => s.isEqual(supporter))
    if (index >= 0) {
      this.collection.splice(index, 1, supporter.toSnapshot())
      return Result.succeed()
    }

    this.collection.push(supporter.toSnapshot())
    return Result.succeed()
  }

  async findById(id: Id): Promise<Result<Supporter | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((s) => s.hasId(id)) ?? null
    return Result.succeed(found)
  }

  async findByEmail(email: Email): Promise<Result<Supporter | null>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const found = allResult.value.find((s) => s.isUsingEmail(email)) ?? null
    return Result.succeed(found)
  }

  async delete(supporter: Supporter): Promise<Result<void>> {
    const allResult = this.hydrateAll()
    if (allResult.error) return Result.fail(allResult.error)

    const index = allResult.value.findIndex((s) => s.isEqual(supporter))
    if (index < 0) return Result.fail(Exception.notFound('SUPPORTER_NOT_FOUND', ['Supporter']))

    this.collection.splice(index, 1)
    return Result.succeed()
  }
}
