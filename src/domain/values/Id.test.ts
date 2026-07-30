import { describe, expect, it } from 'vitest'

import { Id } from './Id'

describe('Id', () => {
  describe('make', () => {
    it('should generate a valid ID with correct length', () => {
      const id = Id.make()
      const exported = id.export()
      expect(exported).toHaveLength(10)
    })

    it('should generate unique IDs', () => {
      const id1 = Id.make()
      const id2 = Id.make()
      expect(id1.isEqual(id2)).toBe(false)
    })
  })

  describe('import', () => {
    it('should import a valid ID string', () => {
      const exported = 'A2CDEFGHJK'
      const idResult = Id.import(exported)

      expect(idResult.error).toBeNull()
      expect(idResult.value).toBeInstanceOf(Id)
      expect(idResult.value?.export()).toBe('A2CDEFGHJK')
    })

    it('should trim string when importing', () => {
      const idResult = Id.import('A2CDEFGHJK  ')
      expect(idResult.error).toBeNull()
      expect(idResult.value?.export()).toBe('A2CDEFGHJK')
    })

    it('should fail to import if length is wrong', () => {
      const idResult = Id.import('ABC')
      expect(idResult.error).toBeInstanceOf(Error)
      expect(idResult.error?.message).toBe('Id length should be 10 characters long.')
    })

    it('should fail to import if contains illegal characters', () => {
      const idResult = Id.import('A2CDEFGHI0')
      expect(idResult.error).toBeInstanceOf(Error)
      expect(idResult.error?.message).toBe('Id should not contain illegal characters.')
    })
  })

  describe('isEqual', () => {
    it('should return true when two IDs have the same value', () => {
      const id1 = Id.import('A2CDEFGHJK').value!
      const id2 = Id.import('A2CDEFGHJK').value!
      expect(id1.isEqual(id2)).toBe(true)
    })

    it('should return false when two IDs have different values', () => {
      const id1 = Id.import('A2CDEFGHJK').value!
      const id2 = Id.import('B2CDEFGHJK').value!
      expect(id1.isEqual(id2)).toBe(false)
    })
  })
})
