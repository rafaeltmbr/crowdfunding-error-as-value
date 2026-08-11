export enum ExceptionGroup {
  Validation = 'Validation',
  NotFound = 'NotFound',
  Infrastructure = 'Infrastructure',
  Unexpected = 'Unexpected',
}

export interface ExceptionSnapshot {
  group: ExceptionGroup
  code: string
  args: unknown[]
  stackTrace: string[]
}

export type ErrorTemplate = (code: string, args: unknown[]) => string

export class Exception {
  public readonly stackTrace: string[]

  // eslint-disable-next-line max-params
  private constructor(
    protected group: ExceptionGroup,
    protected code: string,
    protected args: unknown[],
    stackTrace: string[]
  ) {
    this.stackTrace = stackTrace
  }

  message(template?: ErrorTemplate): string {
    if (template) return template(this.code, this.args)

    return `[${this.group}] ${this.code}: ${this.args.join(', ')}`
  }

  belongToGroup(group: ExceptionGroup): boolean {
    return this.group === group
  }

  hasCode(code: string): boolean {
    return this.code === code
  }

  isEqual(other: Exception): boolean {
    return this.group === other.group && this.code === other.code
  }

  toSnapshot(): ExceptionSnapshot {
    return {
      group: this.group,
      code: this.code,
      args: this.args,
      stackTrace: this.stackTrace,
    }
  }

  static fromSnapshot(snapshot: ExceptionSnapshot): Exception {
    return new Exception(snapshot.group, snapshot.code, snapshot.args, snapshot.stackTrace)
  }

  static make(group: ExceptionGroup, code: string, args: unknown[] = []): Exception {
    return new Exception(group, code, args, this.getStackLines())
  }

  private static getStackLines(): string[] {
    const stackTrace = this.getStackTrace()

    return stackTrace
      ? stackTrace
          .split('\n')
          .slice(1)
          .map((s) => s.trim())
      : []
  }

  private static getStackTrace(): string {
    if (typeof Error.captureStackTrace !== 'function') {
      return new Error().stack ?? ''
    }

    const obj = { stack: '' }
    Error.captureStackTrace(obj, Exception.make)
    return obj.stack
  }

  static validation(code: string, args: unknown[] = []): Exception {
    return this.make(ExceptionGroup.Validation, code, args)
  }

  static notFound(code: string, args: unknown[] = []): Exception {
    return this.make(ExceptionGroup.NotFound, code, args)
  }
}
