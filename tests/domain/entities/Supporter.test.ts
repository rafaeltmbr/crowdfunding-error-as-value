import { Supporter } from '@entities/Supporter'

import { Email } from '@values/Email'
import { describe, expect, it } from 'vitest'
import { Name } from '@values/Name'

describe('Supporter', () => {
  const validName = 'John Snow'
  const validEmail = 'john.snow@example.com'

  describe('make', () => {
    it('should create a supporter with valid values', () => {
      const result = Supporter.make(Name.make(validName).value!, Email.make(validEmail).value!)
      expect(result).toBeSuccess()
    })

    it('should fail if name less than 3 characters', () => {
      const result = Supporter.make(Name.make('Jo').value!, Email.make(validEmail).value!)
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_MIN_LENGTH')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const s1 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      expect(s1.isEqual(s1)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const s1 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const s2 = Supporter.fromSnapshot(s1.toSnapshot()).value!
      expect(s1.isEqual(s2)).toBe(true)
    })

    it('should verify inequality with different instances', () => {
      const s1 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const s2 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      expect(s1.isEqual(s2)).toBe(false)
    })

    it('should verify inequality with different data', () => {
      const s1 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const s3 = Supporter.make(
        Name.make('Jane Doe').value!,
        Email.make('jane.doe@example.com').value!
      ).value!
      expect(s1.isEqual(s3)).toBe(false)
    })
  })

  describe('isUsingEmail', () => {
    it('should return true if email matches', () => {
      const supporter = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const email = Email.make('john.doe@example.com').value!
      expect(supporter.isUsingEmail(email)).toBe(true)
    })

    it('should return false if email does not match', () => {
      const supporter = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const email = Email.make('jane.doe@example.com').value!
      expect(supporter.isUsingEmail(email)).toBe(false)
    })
  })

  describe('hasId', () => {
    it('should return true if id matches', () => {
      const supporter = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      expect(supporter.hasId(supporter.id)).toBe(true)
    })

    it('should return false if id does not match', () => {
      const supporter1 = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
      const supporter2 = Supporter.make(
        Name.make('Jane Doe').value!,
        Email.make('jane.doe@example.com').value!
      ).value!
      expect(supporter1.hasId(supporter2.id)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returns the correct data structure', () => {
      const original = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
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
      const original = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('john.doe@example.com').value!
      ).value!
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

    it('should fail to fromSnapshot empty name', () => {
      const result = Supporter.fromSnapshot({
        id: 'A2CDEFGHJK',
        name: '',
        email: 'john.doe@example.com',
      })
      expect(result).toBeFailureWithCode('NAME_EMPTY')
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

describe('SupporterName', () => {
  describe('make', () => {
    it('should fail with SUPPORTER_NAME_INVALID_FACTORY_METHOD', () => {
      const supporter = Supporter.make(
        Name.make('John Doe').value!,
        Email.make('test@test.com').value!
      ).value!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SupporterNameClass = (supporter as any).name.constructor
      const result = SupporterNameClass.make('test')
      expect(result).toBeFailureWithCode('SUPPORTER_NAME_INVALID_FACTORY_METHOD')
    })
  })
})
