import { Email } from '@common_values/Email'
import { Id } from '@common_values/Id'
import { Result } from '@common_values/Result'
import { Supporter } from '@domain/supporter'

export interface SupporterRepository {
  upsert(supporter: Supporter): Promise<Result<void>>
  findById(id: Id): Promise<Result<Supporter | null>>
  findByEmail(email: Email): Promise<Result<Supporter | null>>
  delete(supporter: Supporter): Promise<Result<void>>
}
