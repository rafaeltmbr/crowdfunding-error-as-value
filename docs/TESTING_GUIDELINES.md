# Domain Testing Guidelines

Reference implementation: `tests/domain/values/Name.test.ts` (source: `src/domain/values/Name.ts`).

## Principles

- Tests are executable specifications. A reader must understand class behavior from the test file alone.
- Be explicit: verify exact error messages, exact snapshot structures, exact return values.
- One logical behavior per `it(...)` block. Multiple `expect()` calls are fine if they verify facets of the same behavior.
- Tests must be deterministic and self-contained. Use `beforeEach` to reset state. Never rely on execution order.

## Structure

Use nested `describe` blocks scoped by method or behavior. Never use a flat list of `it(...)` under a single `describe`.

```typescript
describe('Name', () => {
  describe('make', () => { ... })
  describe('isEqual', () => { ... })
  describe('toSnapshot', () => { ... })
  describe('fromSnapshot', () => { ... })
})
```

Use `'should <expected behavior>'` for `it(...)` descriptions. Be specific enough that the description alone tells you what broke.

## Rules by Method Type

### Factory methods (`make`)

- Test the happy path with valid input.
- Test every validation rule with its exact error message using `toBeFailureWithMessage('...')`.
- Test boundary values (minimum length, single character, zero, etc.).
- If the method normalizes input (e.g., collapsing whitespace), test with tabs `\t`, newlines `\n`, and erratic spaces.

```typescript
// GOOD: verifies exact message
expect(result).toBeFailureWithMessage('Name should not be empty.')

// BAD: passes even if the wrong error is returned
expect(result.error).not.toBeNull()
```

### Equality (`isEqual`, `isLessThan`)

Test these four scenarios independently:
1. Self-equality: `obj.isEqual(obj)` returns `true`.
2. Equivalent equality: two distinct instances with the same data are equal.
3. Inequality: instances with different data are not equal.
4. Nuances: case sensitivity if applicable.

### `toSnapshot`

Assert against the exact expected value using `toEqual(...)`. Never use `toBeDefined()` alone.

```typescript
// GOOD
expect(snapshot).toEqual('Valid Name')

// BAD
expect(snapshot).toBeDefined()
```

### `fromSnapshot`

1. **Round-trip**: `fromSnapshot(obj.toSnapshot())` must produce an object that passes `isEqual()`.
2. **Normalization**: must apply the same rules as `make` (test with untrimmed/padded input).
3. **Invalid data**: corrupted or tampered data must be rejected with exact error messages.

## Edge Cases

Always cover per type:
- **Strings**: `""`, `"   "`, `"\n\t"`, min/max length boundaries.
- **Numbers**: `0`, `-1`, `NaN`, `Infinity`, `-Infinity`.
- **Collections**: `[]`, duplicate items, single-item collections.
- **Identifiers**: wrong length, illegal characters.

## What NOT to Test

- Private/protected methods (test through the public API).
- Framework behavior (vitest, expect).
- External libraries.

## Workflow

Every time a test is created or modified, all three checks must pass:

```bash
npm run test:run    # Run tests with coverage. Goal: 100% on domain logic.
npm run lint        # Ensure stylistic consistency.
npm run typecheck   # Catch type errors that vitest ignores (it strips types at runtime).
```

All three must pass. A test that runs green but fails typechecking or linting is not done.
