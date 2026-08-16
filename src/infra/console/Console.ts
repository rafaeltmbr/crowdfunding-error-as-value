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
    // 1. Initialize Repositories
    const campaignRepository = new CampaignRepositoryInMemory()
    const supporterRepository = new SupporterRepositoryInMemory()

    // 2. Initialize Use Cases
    const createCampaign = new CreateCampaignUseCase(campaignRepository)
    const createSupporter = new CreateSupporterUseCase(supporterRepository)
    const makeDonation = new MakeDonationUseCase(campaignRepository, supporterRepository)

    // 3. Attach to Context
    this.replServer.context['Values'] = {
      Email,
      Exception,
      ExceptionGroup,
      Id,
      Money,
      Name,
      Result,
    }
    this.replServer.context['Entities'] = { Campaign, Donation, Supporter, Tier }
    this.replServer.context['Repositories'] = {
      Campaign: campaignRepository,
      Supporter: supporterRepository,
    }
    this.replServer.context['UseCases'] = {
      CreateCampaign: createCampaign,
      CreateSupporter: createSupporter,
      MakeDonation: makeDonation,
    }
  }

  private setupGracefulShutdown(): void {
    this.replServer.on('exit', () => {
      console.log('Goodbye.')
      process.exit(0)
    })
  }
}
