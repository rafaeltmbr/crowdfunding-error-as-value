import { Supporter } from '@entities/Supporter'
import { SupporterRepository } from '@repositories/SupporterRepository'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { Result } from '@values/Result'

export class SupporterRepositoryInMemory implements SupporterRepository {
  private collection: Supporter[] = []

  async upsert(supporter: Supporter): Promise<Result<void>> {
    const index = this.collection.findIndex((e) => e.isEqual(supporter))
    if (index >= 0) {
      this.collection.splice(index, 1, supporter)
      return Result.succeed()
    }

    this.collection.push(supporter)
    return Result.succeed()
  }

  async findById(id: Id): Promise<Result<Supporter | null>> {
    const supporter = this.collection.find((e) => e.id.isEqual(id)) ?? null
    return Result.succeed(supporter)
  }

  async findByEmail(email: Email): Promise<Result<Supporter | null>> {
    const supporter = this.collection.find((e) => e.isUsingEmail(email)) ?? null
    return Result.succeed(supporter)
  }

  async delete(supporter: Supporter): Promise<Result<void>> {
    const index = this.collection.findIndex((e) => e.isEqual(supporter))
    if (index < 0) return Result.fail(new Error('Supporter does not exist.'))

    this.collection.splice(index, 1)
    return Result.succeed()
  }
}
