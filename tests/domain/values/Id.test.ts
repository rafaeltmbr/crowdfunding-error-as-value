import { describe, expect, it } from 'vitest'

import { Id } from '@values/Id'

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

  describe('fromSnapshot', () => {
    it('should fromSnapshot a valid ID string', () => {
      const snapshot = 'A2CDEFGHJK'
      const idResult = Id.fromSnapshot(snapshot)

      expect(idResult.error).toBeNull()
      expect(idResult.value).toBeInstanceOf(Id)
      expect(idResult.value?.toSnapshot()).toBe('A2CDEFGHJK')
    })

    it('should trim string when fromSnapshot', () => {
      const idResult = Id.fromSnapshot('A2CDEFGHJK  ')
      expect(idResult.error).toBeNull()
      expect(idResult.value?.toSnapshot()).toBe('A2CDEFGHJK')
    })

    it('should fail to fromSnapshot if length is wrong', () => {
      const idResult = Id.fromSnapshot('ABC')
      expect(idResult.error).toBeInstanceOf(Error)
      expect(idResult.error?.message).toBe('Id length should be 10 characters long.')
    })

    it('should fail to fromSnapshot if contains illegal characters', () => {
      const idResult = Id.fromSnapshot('A2CDEFGHI0')
      expect(idResult.error).toBeInstanceOf(Error)
      expect(idResult.error?.message).toBe('Id should not contain illegal characters.')
    })
  })

  describe('isEqual', () => {
    it('should return true when two IDs have the same value', () => {
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
