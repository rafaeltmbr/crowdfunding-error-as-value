class ResultBase {
  static succeed<T>(value: T): Success<T> {
    return new Success(value);
  }

  static fail<E extends Error = Error>(error: E): Failure<E> {
    return new Failure(error);
  }
}

export class Success<T> extends ResultBase {
  readonly error = null;

  constructor(public readonly value: T) {
    super();
  }
}

export class Failure<E extends Error = Error> extends ResultBase {
  readonly value = null;

  constructor(public readonly error: E) {
    super();
  }
}

export type Result<T, E extends Error = Error> = Success<T> | Failure<E>;
export const Result = ResultBase;
