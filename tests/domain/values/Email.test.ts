import { Email } from '@values/Email'
import { describe, expect, it } from 'vitest'

describe('Email', () => {
  describe('make', () => {
    it('should create if valid', () => {
      const result = Email.make('some.email@example.com')
      expect(result).toBeSuccess()
    })

    it('should fail if empty', () => {
      const result = Email.make('')
      expect(result).toBeFailureWithCode('EMAIL_EMPTY')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const email1 = Email.make('some.email@example.com').value!
      expect(email1.isEqual(email1)).toBe(true)
    })

    it('should verify equivalent equality', () => {
      const email1 = Email.make('some.email@example.com').value!
      const email2 = Email.make('some.email@example.com').value!
      expect(email1.isEqual(email2)).toBe(true)
    })

    it('should verify inequality', () => {
      const email1 = Email.make('some.email@example.com').value!
      const email2 = Email.make('other.email@example.com').value!
      expect(email1.isEqual(email2)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returns the correct data structure', () => {
      const result = Email.make('some.email@example.com')
      const snapshot = result.value!.toSnapshot()
      expect(snapshot).toEqual('some.email@example.com')
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
      const original = Email.make('some.email@example.com').value!

      const result = Email.fromSnapshot(original.toSnapshot())
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should normalize email by lowercasing and trimming', () => {
      const original = Email.make('some.email@example.com').value!
      const result = Email.fromSnapshot('  SOME.email@EXAMPLE.com  ')
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should fail if email is empty', () => {
      const result = Email.fromSnapshot('')
      expect(result).toBeFailureWithCode('EMAIL_EMPTY')
    })

    it('should fail if email is invalid', () => {
      const result = Email.fromSnapshot('invalid-email')
      expect(result).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
    })
  })

  describe('Validation errors', () => {
    describe('Missing components', () => {
      it('should fail if email does not have a domain or local-part', () => {
        expect(Email.make('some.email')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
        expect(Email.make('example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
        expect(Email.make('@')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if email is missing the domain part', () => {
        expect(Email.make('some.email@')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
        expect(Email.make('abc@')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if email is missing the local-part', () => {
        expect(Email.make('@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })

    describe('Dot position and duplication', () => {
      it('should fail if domain ends with a dot', () => {
        expect(Email.make('abc@xyz.')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
        expect(Email.make('abc@example.com.')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if domain starts with a dot', () => {
        expect(Email.make('abc@.example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if domain has consecutive dots', () => {
        expect(Email.make('abc@xyz..com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if local-part starts with a dot', () => {
        expect(Email.make('.abc@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if local-part ends with a dot', () => {
        expect(Email.make('abc.@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if local-part has consecutive dots', () => {
        expect(Email.make('abc..def@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })

    describe('Invalid characters', () => {
      it('should fail if domain contains a comma', () => {
        expect(Email.make('abc@xyz,com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if domain contains an underscore', () => {
        expect(Email.make('abc@sub_domain.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if local-part contains unquoted parentheses', () => {
        expect(Email.make('abc()def@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if local-part contains brackets', () => {
        expect(Email.make('abc[]def@example.com')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })

    describe('Invalid TLD', () => {
      it('should fail if TLD is missing entirely', () => {
        expect(Email.make('a@b')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if TLD is too short', () => {
        expect(Email.make('abc@example.c')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if TLD is numeric', () => {
        expect(Email.make('abc@example.123')).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })

    describe('Length boundaries', () => {
      it('should fail if local-part exceeds 64 characters', () => {
        const longLocalPart = 'a'.repeat(65) + '@example.com'
        expect(Email.make(longLocalPart)).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if a domain label exceeds 63 characters', () => {
        const longDomainLabel = 'abc@' + 'a'.repeat(64) + '.com'
        expect(Email.make(longDomainLabel)).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })

      it('should fail if total email length exceeds 254 characters', () => {
        const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(186) + '.com'
        expect(Email.make(longEmail)).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })

    describe('Quoted strings', () => {
      it('should allow valid quoted strings in local-part', () => {
        const result = Email.make('"hello"@example.com')
        expect(result).toBeSuccess()
      })

      it('should fail if characters exist before the quoted string', () => {
        const result = Email.make('x"hello"@example.com')
        expect(result).toBeFailureWithCode('EMAIL_INVALID_FORMAT')
      })
    })
  })
})
