import { Supporter } from '@entities/Supporter'

import { Email } from '@values/Email'
import { describe, expect, it } from 'vitest'

describe('Supporter', () => {
  const validName = 'John Snow'
  const validEmail = 'john.snow@example.com'

  describe('make', () => {
    it('should create a supporter with valid values', () => {
      const result = Supporter.make(validName, validEmail)
      expect(result).toBeSuccess()
    })

    it('should fail if name is empty', () => {
      const result = Supporter.make('', validEmail)
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })

    it('should fail if name less than 3 characters', () => {
      const result = Supporter.make('Jo', validEmail)
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })

    it('should fail if email is empty', () => {
      const result = Supporter.make(validName, '')
      expect(result).toBeFailureWithCode('EMAIL_EMPTY')
    })

    it('should fail if email is invalid', () => {
      const result = Supporter.make(validName, 'john.snow.example.com')
      expect(result).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const s1 = Supporter.make('John Doe', 'john.doe@example.com').value!
      expect(s1.isEqual(s1)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const s1 = Supporter.make('John Doe', 'john.doe@example.com').value!
      const s2 = Supporter.fromSnapshot(s1.toSnapshot()).value!
      expect(s1.isEqual(s2)).toBe(true)
    })

    it('should verify inequality with different instances', () => {
      const s1 = Supporter.make('John Doe', 'john.doe@example.com').value!
      const s2 = Supporter.make('John Doe', 'john.doe@example.com').value!
      expect(s1.isEqual(s2)).toBe(false)
    })

    it('should verify inequality with different data', () => {
      const s1 = Supporter.make('John Doe', 'john.doe@example.com').value!
      const s3 = Supporter.make('Jane Doe', 'jane.doe@example.com').value!
      expect(s1.isEqual(s3)).toBe(false)
    })
  })

  describe('isUsingEmail', () => {
    it('should return true if email matches', () => {
      const supporter = Supporter.make('John Doe', 'john.doe@example.com').value!
      const email = Email.make('john.doe@example.com').value!
      expect(supporter.isUsingEmail(email)).toBe(true)
    })

    it('should return false if email does not match', () => {
      const supporter = Supporter.make('John Doe', 'john.doe@example.com').value!
      const email = Email.make('jane.doe@example.com').value!
      expect(supporter.isUsingEmail(email)).toBe(false)
    })
  })

  describe('hasId', () => {
    it('should return true if id matches', () => {
      const supporter = Supporter.make('John Doe', 'john.doe@example.com').value!
      expect(supporter.hasId(supporter.id)).toBe(true)
    })

    it('should return false if id does not match', () => {
      const supporter1 = Supporter.make('John Doe', 'john.doe@example.com').value!
      const supporter2 = Supporter.make('Jane Doe', 'jane.doe@example.com').value!
      expect(supporter1.hasId(supporter2.id)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returns the correct data structure', () => {
      const original = Supporter.make('John Doe', 'john.doe@example.com').value!
      const snapshot = original.toSnapshot()
      expect(snapshot).toEqual({
        id: snapshot.id,
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
    })
  })

  describe('fromSnapshot', () => {
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
      expect(result).toBeFailureWithCode('ID_ILLEGAL_CHARS')
    })

    it('should fail to fromSnapshot invalid name format', () => {
      const result = Supporter.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'A',
        email: 'john.doe@example.com',
      })
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })

    it('should fail to fromSnapshot invalid email format', () => {
      const result = Supporter.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: 'John Doe',
        email: 'invalid-email',
      })
      expect(result).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
    })
  })
})
