import { describe, expect, it, vi } from 'vitest'
import { ReplHelper } from '../../../src/infra/console/ReplHelper'
import { Result } from '@values/Result'
import { Exception, ExceptionGroup } from '@values/Exception'

describe('ReplHelper', () => {
  describe('isResult', () => {
    it('should return true for an object with error and value properties', () => {
      expect(ReplHelper.isResult({ error: null, value: 123 })).toBe(true)
      expect(ReplHelper.isResult({ error: new Error(), value: null })).toBe(true)
    })

    it('should return false for primitives and null', () => {
      expect(ReplHelper.isResult(null)).toBe(false)
      expect(ReplHelper.isResult(undefined)).toBe(false)
      expect(ReplHelper.isResult('string')).toBe(false)
      expect(ReplHelper.isResult(123)).toBe(false)
    })

    it('should return false for objects without error or value properties', () => {
      expect(ReplHelper.isResult({})).toBe(false)
      expect(ReplHelper.isResult({ error: null })).toBe(false)
      expect(ReplHelper.isResult({ value: 123 })).toBe(false)
    })
  })

  describe('hasSnapshot', () => {
    it('should return true for objects with a toSnapshot method', () => {
      expect(ReplHelper.hasSnapshot({ toSnapshot: () => ({}) })).toBe(true)
    })

    it('should return false for objects without toSnapshot', () => {
      expect(ReplHelper.hasSnapshot({})).toBe(false)
      expect(ReplHelper.hasSnapshot(null)).toBe(false)
      expect(ReplHelper.hasSnapshot(123)).toBe(false)
      expect(ReplHelper.hasSnapshot({ toSnapshot: 'not a function' })).toBe(false)
    })
  })

  describe('toSnapshot', () => {
    it('should return the result of the toSnapshot method', () => {
      expect(ReplHelper.toSnapshot({ toSnapshot: () => ({ snapshot: true }) })).toEqual({
        snapshot: true,
      })
    })
  })

  describe('formatException', () => {
    it('should format an exception with color codes based on its group', () => {
      const ex = Exception.validation('TEST_CODE', ['arg1'])
      const formatted = ReplHelper.formatException(ex)
      expect(formatted).toContain('\x1b[33m') // Yellow for Validation
      expect(formatted).toContain('TEST_CODE')
      expect(formatted).toContain('arg1')
      expect(formatted).toContain('Validation')
    })

    it('should fall back to reset color for unknown group (defensive)', () => {
      const ex = Exception.validation('TEST_CODE')
      vi.spyOn(ex, 'toSnapshot').mockReturnValue({
        ...ex.toSnapshot(),
        group: 'Unknown' as ExceptionGroup,
      })
      const formatted = ReplHelper.formatException(ex)
      expect(formatted).toContain('\x1b[0m✗ Unknown')
      expect(formatted).not.toContain('\x1b[33m')
    })

    it('should omit stack trace if it is empty (defensive)', () => {
      const ex = Exception.validation('TEST_CODE')
      vi.spyOn(ex, 'toSnapshot').mockReturnValue({
        ...ex.toSnapshot(),
        stackTrace: [],
      })
      const formatted = ReplHelper.formatException(ex)
      expect(formatted).not.toContain('\n  at')
    })
  })

  describe('withAutoUnwrap', () => {
    it('should return non-objects as is', () => {
      expect(ReplHelper.withAutoUnwrap(null as any)).toBe(null)
      expect(ReplHelper.withAutoUnwrap(123 as any)).toBe(123)
    })

    it('should unwrap functions returning Success', () => {
      const obj = {
        make: () => Result.succeed({ inner: 'value' }),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      const res = proxied.make() as any
      expect(res.inner).toBe('value')
    })

    it('should throw error for functions returning Failure', () => {
      const ex = Exception.validation('CODE')
      const obj = {
        make: () => Result.fail(ex),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      expect(() => proxied.make()).toThrowError(ex)
    })

    it('should unwrap Promises returning Success', async () => {
      const obj = {
        makeAsync: () => Promise.resolve(Result.succeed({ inner: 'async' })),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      const res = (await proxied.makeAsync()) as any
      expect(res.inner).toBe('async')
    })

    it('should unwrap a successful async Result', async () => {
      const mockResult = { error: null, value: 'async success' }
      const mockObj = {
        async getAsyncResult() {
          return mockResult
        },
      }
      const proxied = ReplHelper.withAutoUnwrap(mockObj)

      await expect(proxied.getAsyncResult()).resolves.toBe('async success')
    })

    it('should preserve the original constructor reference and its prototype', () => {
      class OriginalClass {
        constructor() {}
        dummyMethod() {}
      }
      const instance = new OriginalClass()
      const proxied = ReplHelper.withAutoUnwrap(instance)

      expect(proxied.constructor).toBe(OriginalClass)
      expect(proxied.constructor.prototype).toBe(OriginalClass.prototype)
      expect(proxied.constructor.name).toBe('OriginalClass')
    })

    it('should throw error for Promises returning Failure', async () => {
      const ex = Exception.infrastructure('CODE')
      const obj = {
        makeAsync: () => Promise.resolve(Result.fail(ex)),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      await expect(proxied.makeAsync()).rejects.toThrowError(ex)
    })

    it('should transparently pass through Promise non-Result values', async () => {
      const obj = {
        makeAsync: () => Promise.resolve({ plain: 'object' }),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      const res = (await proxied.makeAsync()) as any
      expect(res.plain).toBe('object')
    })

    it('should pass through non-object Promise resolutions correctly', async () => {
      const obj = {
        makeNull: () => Promise.resolve(null),
        makeString: () => Promise.resolve('hello'),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      expect(await proxied.makeNull()).toBeNull()
      expect(await proxied.makeString()).toBe('hello')
    })

    it('should unwrap Result.succeed with null or primitive correctly', () => {
      const obj = {
        makeNull: () => Result.succeed(null),
        makeString: () => Result.succeed('stringval'),
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      expect(proxied.makeNull()).toBeNull()
      expect(proxied.makeString()).toBe('stringval')
    })

    it('should pass through non-object, non-Result synchronous returns correctly', () => {
      const obj = {
        makeNull: () => null,
        makeString: () => 'hello',
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      expect(proxied.makeNull()).toBeNull()
      expect(proxied.makeString()).toBe('hello')
    })

    it('should use explicit this context if provided (this !== receiver)', () => {
      const obj = {
        make(this: any) {
          return Result.succeed(this.prop)
        },
      }
      const proxied = ReplHelper.withAutoUnwrap(obj)
      const explicitContext = { prop: 'explicit' }
      const res = proxied.make.call(explicitContext)
      expect(res).toBe('explicit')
    })
  })

  describe('consoleWriter', () => {
    it('should unwrap a Success Result and format its inner value', () => {
      const result = Result.succeed({ key: 'inner-value' })
      const output = ReplHelper.consoleWriter(result)
      expect(output).toContain('inner-value')
      expect(output).not.toContain('Success {')
    })

    it('should unwrap a Failure Result and format the exception', () => {
      const ex = Exception.notFound('NOT_FOUND')
      const result = Result.fail(ex)
      const output = ReplHelper.consoleWriter(result)
      expect(output).toContain('NOT_FOUND')
      expect(output).toContain('\x1b[34m') // Blue for NotFound
      expect(output).not.toContain('Failure {')
    })

    it('should use default formatting for non-Result objects', () => {
      const obj = { plain: 'object' }
      const output = ReplHelper.consoleWriter(obj)
      expect(output).toContain('plain')
      expect(output).toContain('object')
    })

    it('should format an object using toSnapshot if it has one', () => {
      const obj = {
        toSnapshot: () => ({ snapshot: 'value' }),
        internal: 'hidden',
      }
      const output = ReplHelper.consoleWriter(obj)
      expect(output).toContain('snapshot')
      expect(output).not.toContain('internal')
    })

    it('should format an array of objects using their toSnapshot methods', () => {
      const arr = [
        { toSnapshot: () => ({ snapshot: '1' }), internal: 'hidden1' },
        { toSnapshot: () => ({ snapshot: '2' }), internal: 'hidden2' },
        { plain: 'object' },
      ]
      const output = ReplHelper.consoleWriter(arr)
      expect(output).toContain('snapshot')
      expect(output).toContain("'1'")
      expect(output).toContain("'2'")
      expect(output).toContain('plain')
      expect(output).toContain("'object'")
      expect(output).not.toContain('hidden1')
      expect(output).not.toContain('hidden2')
    })

    it('should recursively format nested snapshot-aware objects and inject prototypes', () => {
      class NestedClass {
        toSnapshot() {
          return { val: 'nested' }
        }
      }
      class WrapperClass {
        public nested = new NestedClass()
        toSnapshot() {
          return { nested: this.nested.toSnapshot() }
        }
      }

      const output = ReplHelper.consoleWriter(new WrapperClass())
      expect(output).toContain('WrapperClass {')
      expect(output).toContain('NestedClass {')
      expect(output).toContain('val:')
      expect(output).toContain('nested')
    })

    it('should format first-class collections (objects yielding arrays)', () => {
      class ItemClass {
        constructor(public val: string) {}
        toSnapshot() {
          return { val: this.val }
        }
      }
      class CollectionClass {
        public items = [new ItemClass('1'), new ItemClass('2')]
        toSnapshot() {
          return this.items.map((i) => i.toSnapshot())
        }
      }

      const output = ReplHelper.consoleWriter(new CollectionClass())
      expect(output).toContain('ItemClass {')
      expect(output).toContain('val:')
      expect(output).toContain('1')
      expect(output).toContain('2')
    })

    it('should format snapshot objects containing raw arrays of domain objects', () => {
      class ItemClass {
        constructor(public val: string) {}
        toSnapshot() {
          return { val: this.val }
        }
      }
      class WrapperClass {
        public arr = [new ItemClass('nested-array')]
        toSnapshot() {
          return { arr: this.arr.map((i) => i.toSnapshot()) }
        }
      }

      const output = ReplHelper.consoleWriter(new WrapperClass())
      expect(output).toContain('ItemClass {')
      expect(output).toContain('nested-array')
    })

    it('should return raw snapshot array if matching original array is not found in collection', () => {
      class EmptyCollection {
        toSnapshot() {
          return [1, 2, 3]
        }
      }
      const output = ReplHelper.consoleWriter(new EmptyCollection())
      expect(output).toContain('1')
      expect(output).toContain('2')
      expect(output).toContain('3')
    })

    it('should fallback to Object.create(null) if constructor prototype is missing', () => {
      const obj = Object.create(null)
      obj.toSnapshot = () => ({ val: 'test-null-proto' })
      const output = ReplHelper.consoleWriter(obj)
      expect(output).toContain('test-null-proto')
    })
  })
})
