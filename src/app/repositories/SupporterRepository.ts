import { Supporter } from '@entities/Supporter'
import { Email } from '@values/Email'
import { Id } from '@values/Id'
import { Result } from '@values/Result'

export interface SupporterRepository {
  upsert(supporter: Supporter): Promise<Result<void>>
  findById(id: Id): Promise<Result<Supporter | null>>
  findByEmail(email: Email): Promise<Result<Supporter | null>>
  delete(supporter: Supporter): Promise<Result<void>>
}
