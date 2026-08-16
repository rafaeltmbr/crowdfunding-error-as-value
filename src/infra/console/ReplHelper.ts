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
    const { isError, value } = ReplHelper.extractValue(output)

    if (isError) {
      return ReplHelper.formatException(value as Exception)
    }

    const snapshotted = ReplHelper.applyRootSnapshot(value)

    return util.inspect(snapshotted, { colors: true, depth: 4, compact: false })
  }

  private static extractValue(output: unknown): { isError: boolean; value: unknown } {
    if (!ReplHelper.isResult(output)) {
      return { isError: false, value: output }
    }

    const result = output as { error: unknown; value: unknown }

    return result.error !== null
      ? { isError: true, value: result.error }
      : { isError: false, value: result.value }
  }

  private static applyRootSnapshot(original: unknown): unknown {
    if (Array.isArray(original)) {
      return original.map((item) => ReplHelper.applyRootSnapshot(item))
    }

    if (!ReplHelper.hasSnapshot(original)) {
      return original
    }

    const snapObj = ReplHelper.toSnapshot(original)
    return ReplHelper.applyNestedSnapshot(original, snapObj)
  }

  private static applyNestedSnapshot(original: unknown, snapObj: unknown): unknown {
    if (snapObj === null || typeof snapObj !== 'object') {
      return snapObj
    }

    if (Array.isArray(snapObj)) {
      return ReplHelper.applyArraySnapshot(original, snapObj)
    }

    return ReplHelper.applyObjectSnapshot(original, snapObj as Record<string, unknown>)
  }

  private static applyArraySnapshot(original: unknown, snapObj: unknown[]): unknown[] {
    const originalArray = ReplHelper.findOriginalArray(original, snapObj.length)
    if (originalArray === null) return snapObj

    return snapObj.map((item, i) => ReplHelper.applyNestedSnapshot(originalArray[i], item))
  }

  private static findOriginalArray(original: unknown, length: number): unknown[] | null {
    if (Array.isArray(original)) return original

    const originalValues = Object.values(original as object)
    const match = originalValues.find((val) => Array.isArray(val) && val.length === length)

    return match ? (match as unknown[]) : null
  }

  private static applyObjectSnapshot(original: unknown, snapObj: Record<string, unknown>): unknown {
    const originalRecord = original as Record<string, unknown>
    const wrapper = ReplHelper.createWrapper(originalRecord)

    for (const key of Object.keys(snapObj)) {
      const originalValue = originalRecord[key] ?? originalRecord[`_${key}`]
      Object.defineProperty(wrapper, key, {
        value: ReplHelper.applyNestedSnapshot(originalValue, snapObj[key]),
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }

    return wrapper
  }

  private static createWrapper(originalRecord: Record<string, unknown>): Record<string, unknown> {
    if (originalRecord.constructor && originalRecord.constructor.prototype) {
      return Object.create(originalRecord.constructor.prototype) as Record<string, unknown>
    }

    return Object.create(null) as Record<string, unknown>
  }
  /**
   * Checks if a given object has a valid toSnapshot method.
   *
   * @param value Any evaluated value to check.
   * @returns True if the value is an object with a toSnapshot method.
   */
  public static hasSnapshot(value: unknown): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      'toSnapshot' in value &&
      typeof (value as Record<string, unknown>)['toSnapshot'] === 'function'
    )
  }

  /**
   * Extracts the snapshot from a snapshot-aware object.
   *
   * @param value The object to extract the snapshot from.
   * @returns The extracted snapshot.
   */
  public static toSnapshot(value: unknown): unknown {
    return (value as { toSnapshot(): unknown }).toSnapshot()
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

        if (prop === 'constructor') return original

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
