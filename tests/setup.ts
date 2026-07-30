import { expect } from 'vitest'

import { Result } from '@values/Result'

expect.extend({
  toBeSuccess(received: Result<unknown>) {
    const { isNot } = this
    return {
      pass: received.error === null,
      message: () =>
        `expected ${received} ${isNot ? 'not ' : ''}to be a Success result, but it ${
          received.error ? `failed with error: "${received.error.message}"` : 'succeeded'
        }`,
    }
  },
  toBeFailureWithMessage(received: Result<unknown>, expectedMessage: string) {
    const { isNot } = this
    const hasError = received.error !== null
    const messageMatches = received.error?.message === expectedMessage

    return {
      pass: hasError && messageMatches,
      message: () => {
        if (!hasError) {
          return `expected result ${isNot ? 'not ' : ''}to be a Failure, but it succeeded with value: ${JSON.stringify(received.value)}`
        }

        return `expected failure message ${isNot ? 'not ' : ''}to be "${expectedMessage}", but got "${received.error?.message}"`
      },
    }
  },
})
