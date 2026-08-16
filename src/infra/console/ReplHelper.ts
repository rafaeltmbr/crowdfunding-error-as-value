import * as util from 'node:util'

import { Exception } from '@values/Exception'

export class ReplHelper {
  /**
   * Custom output formatter for the Node REPL.
   * Intercepts `Result` objects, extracting their inner values for clean display.
   * If a `Result` is a failure, it delegates to the exception formatter instead
   * of printing a raw object structure.
   *
   * @param output The value evaluated by the REPL.
   * @returns A string representation of the output for the console.
   */
  public static consoleWriter(output: unknown): string {
    if (!ReplHelper.isResult(output)) {
      return util.inspect(output, { colors: true, depth: 4 })
    }

    const result = output as { error: unknown; value: unknown }

    if (result.error !== null) {
      return ReplHelper.formatException(result.error as Exception)
    }

    return util.inspect(result.value, { colors: true, depth: 4 })
  }

  /**
   * Type guard to dynamically verify if an unknown object follows the
   * structural contract of the `Result` monad (having `error` and `value`).
   *
   * @param value Any evaluated value to check.
   * @returns True if the value matches the `Result` signature.
   */
  public static isResult(value: unknown): boolean {
    if (value === null || typeof value !== 'object') return false

    return 'error' in value && 'value' in value
  }

  /**
   * Formats a domain `Exception` into a human-readable, color-coded string.
   * The output highlights the exception group, code, arguments, and truncates
   * the stack trace to prevent flooding the REPL screen.
   *
   * @param exception The domain exception to format.
   * @returns The formatted, colorized exception string.
   */
  public static formatException(exception: Exception): string {
    const snapshot = exception.toSnapshot()
    const reset = '\x1b[0m'
    const color =
      {
        Validation: '\x1b[33m',
        NotFound: '\x1b[34m',
        Infrastructure: '\x1b[31m',
        Unexpected: '\x1b[35m',
      }[snapshot.group] ?? reset

    const argsSuffix = snapshot.args.length > 0 ? ` args: ${JSON.stringify(snapshot.args)}` : ''
    let output = `${color}✗ ${snapshot.group}${reset} [${snapshot.code}]${argsSuffix}\n${color}  ${exception.message()}${reset}`

    if (snapshot.stackTrace.length > 0) {
      const relevantLines = snapshot.stackTrace.slice(0, 5)

      output += '\n  ' + relevantLines.join('\n  ')
    }

    return output
  }

  /**
   * Creates a deep Proxy wrapper around target domain objects.
   * Intercepts function executions to automatically unwrap `Result` objects.
   *
   * This is exclusively intended for the REPL environment to enable a fluent
   * usage experience, allowing the developer to chain domain methods
   * without manually asserting `.value` or `.error` at every step.
   *
   * @param target The target object/class to wrap.
   * @returns A proxy of the target that auto-unwraps any returned Results.
   */
  public static withAutoUnwrap<T extends object>(target: T): T {
    if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
      return target
    }

    return new Proxy(target, {
      get(obj, prop, receiver) {
        const original = Reflect.get(obj, prop, receiver)

        if (typeof original !== 'function') return original

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (this: any, ...args: unknown[]) {
          const ctx: unknown = this === receiver ? obj : this
          const res = original.apply(ctx, args)

          if (res instanceof Promise) {
            return res.then(ReplHelper.unwrapOrThrow)
          }

          return ReplHelper.unwrapOrThrow(res)
        }
      },
    })
  }

  /**
   * Helper executed by `withAutoUnwrap` to unwrap a standard `Result`.
   * Throws domain Exceptions outright so they can be caught by the REPL hook,
   * or delegates deep-proxying to the unwrapped `Result.value` if successful.
   *
   * @param res The potential `Result` object returned by a proxied call.
   * @returns The raw, inner value (which is further wrapped in the proxy).
   */
  private static unwrapOrThrow(res: unknown): unknown {
    if (!ReplHelper.isResult(res)) {
      return res !== null && typeof res === 'object'
        ? ReplHelper.withAutoUnwrap(res as object)
        : res
    }

    const result = res as { error: unknown; value: unknown }

    if (result.error !== null) {
      // eslint-disable-next-line functional/no-throw-statements, @typescript-eslint/only-throw-error
      throw result.error
    }

    return result.value !== null && typeof result.value === 'object'
      ? ReplHelper.withAutoUnwrap(result.value as object)
      : result.value
  }
}
