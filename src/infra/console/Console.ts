import * as repl from 'node:repl'

// Use Cases
import { CreateCampaignUseCase } from '@app/use_cases/CreateCampaignUseCase'
import { CreateSupporterUseCase } from '@app/use_cases/CreateSupporterUseCase'
import { MakeDonationUseCase } from '@app/use_cases/MakeDonationUseCase'
// Entities
import { Campaign } from '@entities/Campaign'
import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
// Repositories (Adapters)
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
// Values
import { Email } from '@values/Email'
import { Exception, ExceptionGroup } from '@values/Exception'
import { Id } from '@values/Id'
import { Money } from '@values/Money'
import { Name } from '@values/Name'
import { Result } from '@values/Result'

export class Console {
  private replServer!: repl.REPLServer

  public async start(): Promise<void> {
    this.setupRepl()
    this.loadContext()
    this.setupGracefulShutdown()
  }

  private setupRepl(): void {
    this.replServer = repl.start({
      prompt: 'crowdfunding > ',
      useColors: true,
    })
  }

  private loadContext(): void {
    Object.assign(this.replServer.context, {
      // Values
      Email,
      Exception,
      ExceptionGroup,
      Id,
      Money,
      Name,
      Result,
      // Entities
      Campaign,
      Donation,
      Supporter,
      Tier,
      // Repositories
      CampaignRepositoryInMemory,
      SupporterRepositoryInMemory,
      // Use Cases
      CreateCampaignUseCase,
      CreateSupporterUseCase,
      MakeDonationUseCase,
    })
  }

  private setupGracefulShutdown(): void {
    this.replServer.on('exit', () => {
      console.log('Goodbye.')
      process.exit(0)
    })
  }
}
