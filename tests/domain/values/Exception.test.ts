import { describe, expect, it } from 'vitest'
import { Exception, ExceptionGroup } from '@values/Exception'

describe('Exception', () => {
  it('should create a validation exception', () => {
    const exception = Exception.validation('TEST_CODE', ['arg1'])
    expect(exception.toSnapshot().group).toBe(ExceptionGroup.Validation)
    expect(exception.toSnapshot().code).toBe('TEST_CODE')
    expect(exception.toSnapshot().args).toEqual(['arg1'])
    expect(exception.stackTrace.length).toBeGreaterThan(0)
  })

  it('should create a notFound exception', () => {
    const exception = Exception.notFound('NOT_FOUND', ['arg1'])
    expect(exception.toSnapshot().group).toBe(ExceptionGroup.NotFound)
    expect(exception.toSnapshot().code).toBe('NOT_FOUND')
    expect(exception.toSnapshot().args).toEqual(['arg1'])
  })

  it('should create an infrastructure exception', () => {
    const exception = Exception.infrastructure('INFRA_ERROR', ['arg1'])
    expect(exception.toSnapshot().group).toBe(ExceptionGroup.Infrastructure)
    expect(exception.toSnapshot().code).toBe('INFRA_ERROR')
    expect(exception.toSnapshot().args).toEqual(['arg1'])
  })

  it('should create an unexpected exception', () => {
    const exception = Exception.unexpected('UNEXPECTED_ERROR', ['arg1'])
    expect(exception.toSnapshot().group).toBe(ExceptionGroup.Unexpected)
    expect(exception.toSnapshot().code).toBe('UNEXPECTED_ERROR')
    expect(exception.toSnapshot().args).toEqual(['arg1'])
  })

  it('should correctly assert group and code', () => {
    const exception = Exception.validation('TEST_CODE')
    expect(exception.belongToGroup(ExceptionGroup.Validation)).toBe(true)
    expect(exception.belongToGroup(ExceptionGroup.NotFound)).toBe(false)
    expect(exception.hasCode('TEST_CODE')).toBe(true)
    expect(exception.hasCode('OTHER_CODE')).toBe(false)
  })

  it('should format message correctly with or without template', () => {
    const exception = Exception.validation('TEST_CODE', ['arg1', 42])
    expect(exception.message()).toBe('[Validation] TEST_CODE: arg1, 42')

    const template = (code: string, args: unknown[]) => `Error ${code} with args ${args.join('-')}`
    expect(exception.message(template)).toBe('Error TEST_CODE with args arg1-42')
  })

  it('should check for equality', () => {
    const ex1 = Exception.validation('CODE')
    const ex2 = Exception.validation('CODE')
    const ex3 = Exception.validation('OTHER')
    const ex4 = Exception.notFound('CODE')

    expect(ex1.isEqual(ex2)).toBe(true)
    expect(ex1.isEqual(ex3)).toBe(false)
    expect(ex1.isEqual(ex4)).toBe(false)
  })

  it('should serialize and deserialize to snapshot', () => {
    const exception = Exception.validation('TEST_CODE', ['arg1'])
    const snapshot = exception.toSnapshot()

    expect(snapshot).toEqual({
      group: ExceptionGroup.Validation,
      code: 'TEST_CODE',
      args: ['arg1'],
      stackTrace: exception.stackTrace,
    })

    const restored = Exception.fromSnapshot(snapshot)
    expect(restored.isEqual(exception)).toBe(true)
    expect(restored.toSnapshot().args).toEqual(exception.toSnapshot().args)
    expect(restored.stackTrace).toEqual(exception.stackTrace)
  })

  it('should fallback when captureStackTrace is missing', () => {
    const original = Error.captureStackTrace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(Error as any).captureStackTrace = undefined

    const exception = Exception.validation('NO_CAPTURE')
    expect(exception.stackTrace.length).toBeGreaterThan(0)

    Error.captureStackTrace = original
  })

  it('should fallback when stack is completely missing', () => {
    const originalCapture = Error.captureStackTrace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(Error as any).captureStackTrace = undefined

    // Save and mock global Error
    const originalError = global.Error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Error = class extends originalError {
      constructor(message?: string) {
        super(message)
        Object.defineProperty(this, 'stack', { value: undefined })
      }
    } as any

    const exception = Exception.validation('NO_STACK_AT_ALL')
    expect(exception.stackTrace).toEqual([])

    // Restore
    global.Error = originalError
    Error.captureStackTrace = originalCapture
  })
})
