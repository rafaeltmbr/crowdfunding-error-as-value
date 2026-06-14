import { describe, expect, it } from 'vitest'

import { Name } from './Name'

describe('Name', () => {
  it('should create a valid name', () => {
    const result = Name.make('Valid Name')
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBe('Valid Name')
  })

  it('should normalize name by collapsing whitespace', () => {
    const result = Name.make('  John    Doe  ')
    expect(result).toBeSuccess()
    expect(result.value!.export()).toBe('John Doe')
  })

  it('should fail if name is empty', () => {
    const result = Name.make('')
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })

  it('should fail if name only contains whitespace', () => {
    const result = Name.make('   ')
    expect(result).toBeFailureWithMessage('Name should not be empty.')
  })
})
