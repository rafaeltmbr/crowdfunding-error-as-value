import * as repl from 'node:repl'
import * as util from 'node:util'

import { CreateCampaignUseCase } from '@app/use_cases/CreateCampaignUseCase'
import { CreateSupporterUseCase } from '@app/use_cases/CreateSupporterUseCase'
import { MakeDonationUseCase } from '@app/use_cases/MakeDonationUseCase'
import { Campaign } from '@entities/Campaign'
import { Donation } from '@entities/Donation'
import { Supporter } from '@entities/Supporter'
import { Tier } from '@entities/Tier'
import { CampaignRepositoryInMemory } from '@infra/repositories/CampaignRepositoryInMemory'
import { SupporterRepositoryInMemory } from '@infra/repositories/SupporterRepositoryInMemory'
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

  // eslint-disable-next-line max-lines-per-function
  private setupRepl(): void {
    this.replServer = repl.start({
      prompt: 'crowdfunding > ',
      useColors: true,
      writer: ReplWriter.write,
      terminal: true,
    })

    this.replServer.setupHistory('.console_history', (err) => {
      if (err) console.error('Failed to load console history:', err)
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
    this.loadValues()
    this.loadEntities()
    this.loadRepositories()
    this.loadUseCases()
  }

  private loadValues(): void {
    Object.assign(this.replServer.context, {
      Email: ReplProxy.wrap(Email),
      Exception,
      ExceptionGroup,
      Id: ReplProxy.wrap(Id),
      Money: ReplProxy.wrap(Money),
      Name: ReplProxy.wrap(Name),
      Result,
    })
  }

  private loadEntities(): void {
    Object.assign(this.replServer.context, {
      Campaign: ReplProxy.wrap(Campaign),
      Donation: ReplProxy.wrap(Donation),
      Supporter: ReplProxy.wrap(Supporter),
      Tier: ReplProxy.wrap(Tier),
    })
  }

  private loadRepositories(): void {
    Object.assign(this.replServer.context, {
      CampaignRepositoryInMemory: ReplProxy.wrap(CampaignRepositoryInMemory),
      SupporterRepositoryInMemory: ReplProxy.wrap(SupporterRepositoryInMemory),
    })
  }

  private loadUseCases(): void {
    Object.assign(this.replServer.context, {
      CreateCampaignUseCase: ReplProxy.wrap(CreateCampaignUseCase),
      CreateSupporterUseCase: ReplProxy.wrap(CreateSupporterUseCase),
      MakeDonationUseCase: ReplProxy.wrap(MakeDonationUseCase),
    })
  }

  private setupGracefulShutdown(): void {
    this.replServer.on('exit', () => {
      console.log('Goodbye.')
      process.exit(0)
    })
  }
}

class ReplWriter {
  static write(output: unknown): string {
    const { isError, value } = ReplWriter.extract(output)

    if (isError) return ReplWriter.formatException(value as Exception)

    return util.inspect(ReplWriter.applyRootSnapshot(value), {
      colors: true,
      depth: 4,
      compact: false,
    })
  }

  private static extract(output: unknown): { isError: boolean; value: unknown } {
    if (!ReplWriter.isResult(output)) return { isError: false, value: output }

    const result = output as { error: unknown; value: unknown }
    return result.error !== null
      ? { isError: true, value: result.error }
      : { isError: false, value: result.value }
  }

  static isResult(value: unknown): boolean {
    if (value === null || typeof value !== 'object') return false

    return 'error' in value && 'value' in value
  }

  private static applyRootSnapshot(original: unknown): unknown {
    if (Array.isArray(original)) return original.map((i) => ReplWriter.applyRootSnapshot(i))

    if (!ReplWriter.hasSnapshot(original)) return original

    return ReplWriter.applyNestedSnapshot(original, ReplWriter.snapshot(original))
  }

  private static applyNestedSnapshot(original: unknown, snap: unknown): unknown {
    if (snap === null || typeof snap !== 'object') return snap

    if (Array.isArray(snap)) return ReplWriter.applyArraySnapshot(original, snap)

    return ReplWriter.applyObjectSnapshot(original, snap as Record<string, unknown>)
  }

  private static applyArraySnapshot(original: unknown, snap: unknown[]): unknown[] {
    const arr = ReplWriter.findArray(original, snap.length)
    if (arr === null) return snap

    return snap.map((item, i) => ReplWriter.applyNestedSnapshot(arr[i], item))
  }

  private static findArray(original: unknown, length: number): unknown[] | null {
    if (Array.isArray(original)) return original

    const match = Object.values(original as object).find(
      (v) => Array.isArray(v) && v.length === length
    )

    return match ? (match as unknown[]) : null
  }

  private static applyObjectSnapshot(original: unknown, snap: Record<string, unknown>): unknown {
    const rec = original as Record<string, unknown>
    const wrapper = ReplWriter.createWrapper(rec)

    for (const key of Object.keys(snap)) {
      const orig = rec[key] ?? rec[`_${key}`]
      Object.defineProperty(wrapper, key, {
        value: ReplWriter.applyNestedSnapshot(orig, snap[key]),
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }

    return wrapper
  }

  private static createWrapper(rec: Record<string, unknown>): Record<string, unknown> {
    if (rec.constructor?.prototype) {
      return Object.create(rec.constructor.prototype) as Record<string, unknown>
    }

    return Object.create(null) as Record<string, unknown>
  }

  private static hasSnapshot(value: unknown): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      'toSnapshot' in value &&
      typeof (value as Record<string, unknown>)['toSnapshot'] === 'function'
    )
  }

  private static snapshot(value: unknown): unknown {
    return (value as { toSnapshot(): unknown }).toSnapshot()
  }

  private static formatException(exception: Exception): string {
    const snap = exception.toSnapshot()
    const reset = '\x1b[0m'
    const colors: Partial<Record<ExceptionGroup, string>> = {
      [ExceptionGroup.Validation]: '\x1b[33m',
      [ExceptionGroup.NotFound]: '\x1b[34m',
      [ExceptionGroup.Infrastructure]: '\x1b[31m',
      [ExceptionGroup.Unexpected]: '\x1b[35m',
    }
    const color = colors[snap.group] ?? reset
    const args = snap.args.length > 0 ? ` args: ${JSON.stringify(snap.args)}` : ''
    let out = `${color}✗ ${snap.group}${reset} [${snap.code}]${args}\n${color}  ${exception.message()}${reset}`

    if (snap.stackTrace.length > 0) out += '\n  ' + snap.stackTrace.slice(0, 5).join('\n  ')

    return out
  }
}

class ReplProxy {
  static wrap<T extends object>(target: T): T {
    if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
      return target
    }

    return new Proxy(target, {
      get(obj, prop, receiver) {
        const original = Reflect.get(obj, prop, receiver)

        if (prop === 'constructor') return original

        if (typeof original !== 'function') return original

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...args: unknown[]) {
          const ctx: unknown = this === receiver ? obj : this
          const res = original.apply(ctx, args)

          if (res instanceof Promise) return res.then(ReplProxy.unwrapOrThrow)

          return ReplProxy.unwrapOrThrow(res)
        }
      },
    })
  }

  private static unwrapOrThrow(res: unknown): unknown {
    if (!ReplWriter.isResult(res)) {
      return res !== null && typeof res === 'object' ? ReplProxy.wrap(res as object) : res
    }

    const result = res as { error: unknown; value: unknown }

    if (result.error !== null) {
      // eslint-disable-next-line functional/no-throw-statements, @typescript-eslint/only-throw-error
      throw result.error
    }

    return result.value !== null && typeof result.value === 'object'
      ? ReplProxy.wrap(result.value as object)
      : result.value
  }
}
