import { describe, expect, it } from 'vitest'

import { Result } from './Result'

describe('Result', () => {
  it('should create a success result', () => {
    const value = { foo: 'bar' }
    const result = Result.succeed(value)

    expect(result).toBeSuccess()
    expect(result.value).toBe(value)
    expect(result.error).toBeNull()
  })

  it('should create a success result with void', () => {
    const result: Result<void> = Result.succeed()

    expect(result).toBeSuccess()
    expect(result.value).toBeUndefined()
    expect(result.error).toBeNull()
  })

  it('should create a failure result', () => {
    const error = new Error('Something went wrong')
    const result = Result.fail(error)

    expect(result).toBeFailureWithMessage('Something went wrong')
    expect(result.error).toBe(error)
    expect(result.value).toBeNull()
  })
})
