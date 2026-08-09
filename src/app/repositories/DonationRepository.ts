import { Donation } from '@entities/Donation'
import { Id } from '@values/Id'
import { Result } from '@values/Result'

export interface DonationRepository {
  upsert(donation: Donation): Promise<Result<void>>
  findById(id: Id): Promise<Result<Donation | null>>
  findBySupporterId(supporterId: Id): Promise<Result<Donation | null>>
  delete(donation: Donation): Promise<Result<void>>
}
