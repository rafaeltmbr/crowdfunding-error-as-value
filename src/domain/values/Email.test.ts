import { Email } from '@values/Email'
import { describe, expect, it } from 'vitest'

describe('Email', () => {
  const invalidFormats = [
    'some.email',
    'example.com',
    'some.email@',
    '@example.com',
    'abc@xyz.',
    'a@b',
  ] as const

  it('should create if valid', () => {
    const result = Email.make('some.email@example.com')
    expect(result).toBeSuccess()
  })

  it('should verify equality', () => {
    const email1 = Email.make('some.email@example.com').value!
    const email2 = Email.make('some.email@example.com').value!
    const email3 = Email.make('other.email@example.com').value!

    expect(email1.isEqual(email2)).toBe(true)
    expect(email1.isEqual(email3)).toBe(false)
  })

  it('should verify export returns data', () => {
    const result = Email.make('some.email@example.com')
    expect(result.value!.export()).toBeDefined()
  })

  it('should fail if empty', () => {
    const result = Email.make('')
    expect(result).toBeFailureWithMessage('Email should not be empty.')
  })

  for (const invalidFormat of invalidFormats) {
    it(`should fail if format is invalid (${invalidFormat})`, () => {
      const result = Email.make(invalidFormat)
      expect(result).toBeFailureWithMessage('Email format should be valid.')
    })
  }

  it('should import an exported data and produce an equivalent object', () => {
    const original = Email.make('some.email@example.com').value!

    const result = Email.import(original.export())
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })

  it('should not be able to import corrupted data', () => {
    const result = Email.import(1)
    expect(result).toBeFailureWithMessage('Cannot import Email from invalid data format.')
  })
})
