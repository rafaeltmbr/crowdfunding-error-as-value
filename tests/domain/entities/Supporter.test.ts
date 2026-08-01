import { Supporter } from '@entities/Supporter'
import { describe, expect, it } from 'vitest'

describe('Supporter', () => {
  const validName = 'John Snow'
  const validEmail = 'john.snow@example.com'

  it('should create a supporter with valid values', () => {
    const result = Supporter.make(validName, validEmail)
    expect(result).toBeSuccess()
  })

  it('should fail if name is empty', () => {
    const result = Supporter.make('', validEmail)
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if name less than 3 characters', () => {
    const result = Supporter.make('Jo', validEmail)
    expect(result).toBeFailureWithMessage('Supporter name should be at least 3 characters long.')
  })

  it('should fail if email is empty', () => {
    const result = Supporter.make(validName, '')
    expect(result).toBeFailureWithMessage('Email should not be empty.')
  })

  it('should fail if email is invalid', () => {
    const result = Supporter.make(validName, 'john.snow.example.com')
    expect(result).toBeFailureWithMessage('Email format should be valid.')
  })

  it('should compare supporters for identity', () => {
    const s1 = Supporter.make('John Doe', 'john.doe@example.com').value!
    const s2 = Supporter.make('John Doe', 'john.doe@example.com').value!
    const s3 = Supporter.make('Jane Doe', 'jane.doe@example.com').value!

    expect(s1.isEqual(s1)).toBe(true)
    expect(s1.isEqual(s2)).toBe(false)
    expect(s1.isEqual(s3)).toBe(false)
  })

  it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
    const original = Supporter.make('John Doe', 'john.doe@example.com').value!
    const snapshot = original.toSnapshot()

    const result = Supporter.fromSnapshot(snapshot)
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })

  it('should fail to fromSnapshot invalid id format', () => {
    const result = Supporter.fromSnapshot({
      id: 'O0CDEFGHI1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
    expect(result).toBeFailureWithMessage('Id should not contain illegal characters.')
  })

  it('should fail to fromSnapshot invalid name format', () => {
    const result = Supporter.fromSnapshot({
      id: 'A2CDEFGHJK',
      name: 'A',
      email: 'john.doe@example.com',
    })
    expect(result).toBeFailureWithMessage('Supporter name should be at least 3 characters long.')
  })

  it('should fail to fromSnapshot invalid email format', () => {
    const result = Supporter.fromSnapshot({
      id: 'A2CDEFGHJK',
      name: 'John Doe',
      email: 'invalid-email',
    })
    expect(result).toBeFailureWithMessage('Email format should be valid.')
  })
})
