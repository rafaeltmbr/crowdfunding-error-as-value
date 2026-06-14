class ResultBase {
  static succeed(): Success<void>
  static succeed<T>(value: T): Success<T>
  static succeed<T>(value?: T): Success<T> {
    return new Success(value as T)
  }

  static fail<E extends Error = Error>(error: E): Failure<E> {
    return new Failure(error)
  }
}

export class Success<T> extends ResultBase {
  readonly error = null

  constructor(public readonly value: T) {
    super()
  }
}

export class Failure<E extends Error = Error> extends ResultBase {
  readonly value = null

  constructor(public readonly error: E) {
    super()
  }
}

export type Result<T, E extends Error = Error> = Success<T> | Failure<E>

/**
 * **Result Pattern**
 *
 * The `Result` class is the base abstraction that wrappers errors and values
 * in other to implement the **Result Pattern**, where a result might
 * contain a value or an error (one or the other, never both).
 *
 * Instead of throwing exceptions, the **Result Pattern** allows errors to be
 * returned as values. So, errors are explicitly expected, and hopefully, treated.
 * For example:
 *
 * ```ts
 * function safeDivision(
 *   dividend: number,
 *   divisor: number,
 * ): Result<number, Error> {
 *   if (Number.isNaN(dividend)) {
 *     return Result.fail(new Error("Dividend must be a number."));
 *   }
 *
 *   if (Number.isNaN(divisor)) {
 *     return Result.fail(new Error("Divisor must be a number."));
 *   }
 *
 *   if (divisor === 0) {
 *     return Result.fail(new Error("Divisor must not be zero."));
 *   }
 *
 *   return Result.succeed(dividend / divisor);
 * }
 *
 * export function handlingErrors() {
 *   const dividend = Math.random();
 *   const divisor = Math.floor(Math.random() * 10); // generate numbers ranging from 0...9
 *   const result = safeDivision(dividend, divisor);
 *
 *   if (result.error) {
 *     return console.error(result.error.message);
 *   }
 *
 *   console.log(`${dividend}/${divisor} = ${result.value}`);
 * }
 * ```
 */
export const Result = ResultBase
