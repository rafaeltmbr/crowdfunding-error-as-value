import { Id } from '@values/Id'
import { describe, expect, it } from 'vitest'

describe('Id', () => {
  describe('make', () => {
    it('should generate a valid ID with correct length', () => {
      const id = Id.make()
      const snapshot = id.toSnapshot()
      expect(snapshot).toHaveLength(10)
    })

    it('should generate unique IDs', () => {
      const id1 = Id.make()
      const id2 = Id.make()
      expect(id1.isEqual(id2)).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should verify toSnapshot returns the exact ID string', () => {
      const id = Id.fromSnapshot('A2CDEFGHJK').value!
      expect(id.toSnapshot()).toEqual('A2CDEFGHJK')
    })
  })

  describe('fromSnapshot', () => {
    it('should fromSnapshot a valid ID string', () => {
      const snapshot = 'A2CDEFGHJK'
      const idResult = Id.fromSnapshot(snapshot)

      expect(idResult).toBeSuccess()
      expect(idResult.value?.toSnapshot()).toBe('A2CDEFGHJK')
    })

    it('should normalize whitespace when fromSnapshot', () => {
      const idResult = Id.fromSnapshot('A2CDEFGHJK  ')
      expect(idResult).toBeSuccess()
      expect(idResult.value?.toSnapshot()).toBe('A2CDEFGHJK')
    })

    it('should fail to fromSnapshot if length is wrong', () => {
      const idResult = Id.fromSnapshot('ABC')
      expect(idResult).toBeFailureWithMessage('Id length should be 10 characters long.')
    })

    it('should fail to fromSnapshot if contains illegal characters', () => {
      const idResult = Id.fromSnapshot('A2CDEFGHI0')
      expect(idResult).toBeFailureWithMessage('Id should not contain illegal characters.')
    })
  })

  describe('isEqual', () => {
    it('should verify self-equality', () => {
      const id1 = Id.fromSnapshot('A2CDEFGHJK').value!
      expect(id1.isEqual(id1)).toBe(true)
    })

    it('should return true when two IDs have the same equivalent value', () => {
      const id1 = Id.fromSnapshot('A2CDEFGHJK').value!
      const id2 = Id.fromSnapshot('A2CDEFGHJK').value!
      expect(id1.isEqual(id2)).toBe(true)
    })

    it('should return false when two IDs have different values', () => {
      const id1 = Id.fromSnapshot('A2CDEFGHJK').value!
      const id2 = Id.fromSnapshot('B2CDEFGHJK').value!
      expect(id1.isEqual(id2)).toBe(false)
    })
  })
})
