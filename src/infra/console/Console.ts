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
import { ReplHelper } from '@infra/console/ReplHelper'
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
      writer: ReplHelper.consoleWriter,
    })

    // Intercept REPL evaluation to catch auto-unwrapped domain exceptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultEval = (this.replServer as any).eval

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, max-params
    ;(this.replServer as any).eval = function (
      this: unknown,
      cmd: unknown,
      context: unknown,
      filename: unknown,
      callback: (err: unknown, result: unknown) => void
    ) {
      defaultEval.call(this, cmd, context, filename, (err: unknown, result: unknown) => {
        if (
          err !== null &&
          typeof err === 'object' &&
          'toSnapshot' in err &&
          typeof err.toSnapshot === 'function'
        ) {
          return callback(null, Result.fail(err))
        }

        callback(err, result)
      })
    }
  }

  private loadContext(): void {
    Object.assign(this.replServer.context, {
      // Values
      Email: ReplHelper.withAutoUnwrap(Email),
      Exception,
      ExceptionGroup,
      Id: ReplHelper.withAutoUnwrap(Id),
      Money: ReplHelper.withAutoUnwrap(Money),
      Name: ReplHelper.withAutoUnwrap(Name),
      Result,
      // Entities
      Campaign: ReplHelper.withAutoUnwrap(Campaign),
      Donation: ReplHelper.withAutoUnwrap(Donation),
      Supporter: ReplHelper.withAutoUnwrap(Supporter),
      Tier: ReplHelper.withAutoUnwrap(Tier),
      // Repositories
      CampaignRepositoryInMemory: ReplHelper.withAutoUnwrap(CampaignRepositoryInMemory),
      SupporterRepositoryInMemory: ReplHelper.withAutoUnwrap(SupporterRepositoryInMemory),
      // Use Cases
      CreateCampaignUseCase: ReplHelper.withAutoUnwrap(CreateCampaignUseCase),
      CreateSupporterUseCase: ReplHelper.withAutoUnwrap(CreateSupporterUseCase),
      MakeDonationUseCase: ReplHelper.withAutoUnwrap(MakeDonationUseCase),
    })
  }

  private setupGracefulShutdown(): void {
    this.replServer.on('exit', () => {
      console.log('Goodbye.')
      process.exit(0)
    })
  }
}
