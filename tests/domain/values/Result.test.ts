import { Result, Success, Failure } from '@values/Result'
import { describe, expect, it } from 'vitest'

describe('Result', () => {
  describe('succeed', () => {
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
  })

  describe('fail', () => {
    it('should create a failure result', () => {
      const error = new Error('Something went wrong')
      const result = Result.fail(error)

      expect(result).toBeFailureWithMessage('Something went wrong')
      expect(result.error).toBe(error)
      expect(result.value).toBeNull()
    })
  })
})

describe('Success', () => {
  it('should hold the value and null error', () => {
    const value = { foo: 'bar' }
    const success = new Success(value)

    expect(success.value).toBe(value)
    expect(success.error).toBeNull()
  })
})

describe('Failure', () => {
  it('should hold the error and null value', () => {
    const error = new Error('Something went wrong')
    const failure = new Failure(error)

    expect(failure.error).toBe(error)
    expect(failure.value).toBeNull()
  })
})
