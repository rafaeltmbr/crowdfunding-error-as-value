import { Email, Id, Result } from '@domain/common_values'
import { Supporter } from '@domain/supporter'

export interface SupporterRepository {
  upsert(supporter: Supporter): Promise<Result<void>>
  findById(id: Id): Promise<Result<Supporter | null>>
  findByEmail(email: Email): Promise<Result<Supporter | null>>
  delete(supporter: Supporter): Promise<Result<void>>
}
