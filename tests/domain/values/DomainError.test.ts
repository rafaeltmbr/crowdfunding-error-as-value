import { DomainError, NotFoundError, ValidationError } from '@values/DomainError'
import { describe, expect, it } from 'vitest'

describe('DomainError', () => {
  it('should set the name property to the constructor name', () => {
    const error = new ValidationError('TEST_CODE', 'test message')
    expect(error.name).toBe('ValidationError')
  })

  it('should be an instance of Error', () => {
    const error = new ValidationError('TEST_CODE', 'test message')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DomainError)
  })
})

describe('ValidationError', () => {
  it('should create a validation error with code and message', () => {
    const error = new ValidationError('FIELD_REQUIRED', 'Field is required.')
    expect(error.tag).toBe('ValidationError')
    expect(error.code).toBe('FIELD_REQUIRED')
    expect(error.message).toBe('Field is required.')
    expect(error.params).toEqual({})
  })

  it('should create a validation error with params', () => {
    const error = new ValidationError('NAME_MIN_LENGTH', 'Name is too short.', {
      minLength: 3,
    })
    expect(error.params).toEqual({ minLength: 3 })
  })

  it('should be an instance of DomainError and Error', () => {
    const error = new ValidationError('TEST', 'test')
    expect(error).toBeInstanceOf(DomainError)
    expect(error).toBeInstanceOf(Error)
  })

  it('should preserve the name of leaf subclasses', () => {
    class CustomValidationError extends ValidationError {
      constructor() {
        super('CUSTOM', 'custom error')
      }
    }

    const error = new CustomValidationError()
    expect(error.name).toBe('CustomValidationError')
    expect(error.tag).toBe('ValidationError')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error).toBeInstanceOf(DomainError)
  })
})

describe('NotFoundError', () => {
  it('should create a not found error with entity name', () => {
    const error = new NotFoundError('Campaign')
    expect(error.tag).toBe('NotFoundError')
    expect(error.entity).toBe('Campaign')
    expect(error.message).toBe('Campaign does not exist.')
  })

  it('should be an instance of DomainError and Error', () => {
    const error = new NotFoundError('Supporter')
    expect(error).toBeInstanceOf(DomainError)
    expect(error).toBeInstanceOf(Error)
  })

  it('should set the name property to NotFoundError', () => {
    const error = new NotFoundError('Donation')
    expect(error.name).toBe('NotFoundError')
  })
})
