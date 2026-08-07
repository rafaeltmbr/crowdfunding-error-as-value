import { Name } from '@values/Name'
import { describe, expect, it } from 'vitest'

describe('Name', () => {
  it('should create a valid name', () => {
    const result = Name.make('Valid Name')
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(Name.make('Valid Name').value!)).toBe(true)
  })

  it('should verify inequality', () => {
    const name1 = Name.make('John').value!
    const name2 = Name.make('Jane').value!
    expect(name1.isEqual(name2)).toBe(false)
  })
  it('should normalize name by collapsing whitespace', () => {
    const result = Name.make('  John    Doe  ')
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(Name.make('John Doe').value!)).toBe(true)
  })

  it('should verify toSnapshot returns data', () => {
    const result = Name.make('Valid Name')
    expect(result.value!.toSnapshot()).toBeDefined()
  })

  it('should fail if name is empty', () => {
    const result = Name.make('')
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if name only contains whitespace', () => {
    const result = Name.make('   ')
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fromSnapshot a snapshot data and produce an equivalent object', () => {
    const original = Name.make('Abc123').value!

    const result = Name.fromSnapshot(original.toSnapshot())
    expect(result).toBeSuccess()
    expect(result.value!.isEqual(original)).toBe(true)
  })
})
