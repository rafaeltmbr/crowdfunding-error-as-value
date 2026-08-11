export abstract class DomainError extends Error {
  abstract readonly tag: string

  protected constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends DomainError {
  readonly tag = 'ValidationError' as const

  constructor(
    public readonly code: string,
    message: string,
    public readonly params: Record<string, unknown> = {}
  ) {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  readonly tag = 'NotFoundError' as const

  constructor(public readonly entity: string) {
    super(`${entity} does not exist.`)
  }
}
