import { Name } from '@values/Name'
import { describe, expect, it } from 'vitest'

describe('Name', () => {
  describe('make', () => {
    it('should create a valid name', () => {
      const result = Name.make('Valid Name')
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(Name.make('Valid Name').value!)).toBe(true)
    })

    it('should create a valid name with a single character boundary', () => {
      const result = Name.make('A')
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(Name.make('A').value!)).toBe(true)
    })

    it('should normalize name by collapsing spaces', () => {
      const result = Name.make('  John    Doe  ')
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(Name.make('John Doe').value!)).toBe(true)
    })

    it('should normalize name by collapsing other whitespace characters (tabs, newlines)', () => {
      const result = Name.make('\t\n John \r Doe \n')
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(Name.make('John Doe').value!)).toBe(true)
    })

    it('should fail if name is empty', () => {
      const result = Name.make('')
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })

    it('should fail if name only contains whitespace', () => {
      const result = Name.make('   ')
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })
  })

  describe('isEqual', () => {
    it('should verify equality', () => {
      const name1 = Name.make('John Doe').value!
      const name2 = Name.make('John Doe').value!
      expect(name1.isEqual(name2)).toBe(true)
    })

    it('should verify equality with itself', () => {
      const name1 = Name.make('John Doe').value!
      expect(name1.isEqual(name1)).toBe(true)
    })

    it('should verify inequality', () => {
      const name1 = Name.make('John').value!
      const name2 = Name.make('Jane').value!
      expect(name1.isEqual(name2)).toBe(false)
    })

    it('should be case sensitive', () => {
      const name1 = Name.make('John').value!
      const name2 = Name.make('john').value!
      expect(name1.isEqual(name2)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returnts the correct data structure', () => {
      const result = Name.make('Valid Name')
      const snapshot = result.value!.toSnapshot()
      expect(snapshot).toEqual('Valid Name')
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
      const original = Name.make('Abc123').value!

      const result = Name.fromSnapshot(original.toSnapshot())
      expect(result).toBeSuccess()
      expect(result.value!.isEqual(original)).toBe(true)
    })

    it('should normalize whitespace when using fromSnapshot', () => {
      const result = Name.fromSnapshot('  John   Doe  ')
      expect(result).toBeSuccess()
      expect(result.value!.toSnapshot()).toEqual('John Doe')
    })

    it('should fail fromSnapshot from invalid format data', () => {
      const result = Name.fromSnapshot('')
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })

    it('should fail fromSnapshot from whitespace-only data', () => {
      const result = Name.fromSnapshot('   \n\t  ')
      expect(result).toBeFailureWithCode('NAME_EMPTY')
    })
  })
})
