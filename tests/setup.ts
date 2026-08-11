import { Result } from '@values/Result'
import { expect } from 'vitest'

expect.extend({
  toBeSuccess(received: Result<unknown>) {
    const { isNot } = this
    return {
      pass: received.error === null,
      message: () => {
        const errorMessage = received.error
          ? typeof (received.error as any).message === 'function'
            ? (received.error as any).message()
            : (received.error as any).message
          : ''
        return `expected ${received} ${isNot ? 'not ' : ''}to be a Success result, but it ${
          received.error ? `failed with error: "${errorMessage}"` : 'succeeded'
        }`
      },
    }
  },
  toBeFailureWithMessage(received: Result<unknown>, expectedMessage: string) {
    const { isNot } = this
    const hasError = received.error !== null
    const errorMessage = hasError
      ? typeof (received.error as any).message === 'function'
        ? (received.error as any).message()
        : (received.error as any).message
      : undefined
    const messageMatches = errorMessage === expectedMessage

    return {
      pass: hasError && messageMatches,
      message: () => {
        if (!hasError) {
          return `expected result ${isNot ? 'not ' : ''}to be a Failure, but it succeeded with value: ${JSON.stringify(received.value)}`
        }

        return `expected failure message ${isNot ? 'not ' : ''}to be "${expectedMessage}", but got "${errorMessage}"`
      },
    }
  },
  toBeFailureWithCode(received: Result<unknown>, expectedCode: string) {
    const { isNot } = this
    const hasError = received.error !== null
    const hasCorrectCode = hasError && (received.error as any).hasCode?.(expectedCode)

    return {
      pass: hasError && hasCorrectCode,
      message: () => {
        if (!hasError) return `expected result ${isNot ? 'not ' : ''}to be a Failure...`
        return `expected failure code ${isNot ? 'not ' : ''}to be "${expectedCode}", but got "${(received.error as any)?.code}"`
      },
    }
  },
  toBeFailureOfGroup(received: Result<unknown>, expectedGroup: any) {
    const { isNot } = this
    const hasError = received.error !== null
    const hasCorrectGroup = hasError && (received.error as any).belongToGroup?.(expectedGroup)

    return {
      pass: hasError && hasCorrectGroup,
      message: () => {
        if (!hasError) return `expected result ${isNot ? 'not ' : ''}to be a Failure...`
        return `expected failure group ${isNot ? 'not ' : ''}to be "${expectedGroup}", but got "${(received.error as any)?.group}"`
      },
    }
  },
})
