import { Exception } from '@values/Exception'

class ResultBase {
  static succeed(): Success<void>
  static succeed<T>(value: T): Success<T>
  static succeed<T>(value?: T): Success<T> {
    return new Success(value as T)
  }

  static fail<E = Exception>(error: E): Failure<E> {
    return new Failure(error)
  }
}

export class Success<T> extends ResultBase {
  readonly error = null

  constructor(public readonly value: T) {
    super()
  }
}

export class Failure<E = Exception> extends ResultBase {
  readonly value = null

  constructor(public readonly error: E) {
    super()
  }
}

export type Result<T, E = Exception> = Success<T> | Failure<E>

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
 *     return Result.fail(Exception.validation("DIVIDEND_NOT_NUMBER"));
 *   }
 *
 *   if (Number.isNaN(divisor)) {
 *     return Result.fail(Exception.validation("DIVISOR_NOT_NUMBER"));
 *   }
 *
 *   if (divisor === 0) {
 *     return Result.fail(Exception.validation("DIVISOR_ZERO"));
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
 *     return console.error(result.error.message());
 *   }
 *
 *   console.log(`${dividend}/${divisor} = ${result.value}`);
 * }
 * ```
 */
export const Result = ResultBase
