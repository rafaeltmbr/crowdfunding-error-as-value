# Testing 

Reference implementation: `tests/domain/values/Name.test.ts`.

## Principles

- Tests are executable specifications. A reader must understand class behavior from the test file alone.
- Explicit over implicit: import `describe`, `expect`, `it`, `beforeEach` from `vitest`. Globals are disabled.
- Verify exact error messages, exact snapshot structures, exact return values.
- One logical behavior per `it(...)` block. Multiple `expect()` calls are fine if they verify facets of the same behavior.
- Tests must be deterministic and self-contained. Use `beforeEach` to reset mutable state. Never rely on execution order.

## Custom Matchers

Defined in `tests/setup.ts`:

- `toBeSuccess()` — asserts `result.error === null`. On failure, prints the actual error message.
- `toBeFailureWithMessage('exact message')` — asserts the result failed with the exact message string.

Always use `toBeFailureWithMessage(...)`. Never assert just `expect(result.error).not.toBeNull()`.

## Structure

Every public method gets its own `describe` block. Nest under the class name.

```typescript
describe('Campaign', () => {
  describe('make', () => { ... })
  describe('addTier', () => { ... })
  describe('makeDonation', () => { ... })
  describe('isEqual', () => { ... })
  describe('toSnapshot', () => { ... })
  describe('fromSnapshot', () => { ... })
})
```

Use `'should <expected behavior>'` for `it(...)` descriptions. Be specific enough that the description alone tells you what broke.

## Test Setup

- Use `beforeEach` for mutable or stateful objects (repositories, aggregates being modified across tests).
- Immutable fixtures (Value Objects and Entities used as read-only inputs) may live at `describe` scope when never mutated.
- `.value!` is acceptable when the success path is already proven in a dedicated happy-path test. In the happy-path test itself, assert `toBeSuccess()` before accessing `.value`.

## Rules by Method Type

### Factory methods (`make`)

- Test the happy path with valid input.
- Test every validation rule with its exact error message using `toBeFailureWithMessage('...')`.
- Test boundary values (minimum length, single character, zero, etc.).
- If the method normalizes input (e.g., collapsing whitespace), test with tabs `\t`, newlines `\n`, and erratic spaces.

```typescript
// GOOD
expect(result).toBeFailureWithMessage('Name should not be empty.')

// BAD
expect(result.error).not.toBeNull()
```

### Equality (`isEqual`, `isLessThan`)

Test these four scenarios independently:

1. Self-equality: `obj.isEqual(obj)` returns `true`.
2. Equivalent equality: two distinct instances with the same data are equal.
3. Inequality: instances with different data are not equal.
4. Nuances: case sensitivity if applicable.

### Behavior methods

Methods that mutate state or enforce invariants (`addTier`, `makeDonation`, etc.):

- Test the happy path.
- Test every rejection path with exact error message.
- Test boundary/edge cases (empty collections, duplicates, threshold values).

### `toSnapshot`

Assert the exact expected value using `toEqual(...)`. Never use `toBeDefined()` alone.

For randomly generated fields (e.g., `id`), use the self-referencing pattern:

```typescript
// GOOD: asserts the full structure
const snapshot = tier.toSnapshot()
expect(snapshot).toEqual({ id: snapshot.id, name: 'Tier 1', value: 10 })

// BAD: doesn't verify shape or type of id
expect(snapshot.id).toBeDefined()
```

### `fromSnapshot`

1. **Round-trip**: `fromSnapshot(obj.toSnapshot())` must produce an object that passes `isEqual()`.
2. **Normalization**: if the method normalizes input, test it (e.g., trimming whitespace).
3. **Invalid data**: test at least one corrupted input per distinct validation path, using `toBeFailureWithMessage('...')`. When `fromSnapshot` delegates to `make`, a representative subset is sufficient — do not duplicate all `make` tests.

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

Every time a test is created or modified, all four checks must pass:

```bash
npm run test:run      # Run tests with coverage. Goal: 100% on domain logic.
npm run lint          # Ensure stylistic consistency.
npm run typecheck     # Catch type errors that vitest ignores (it strips types at runtime).
npm run format:check  # Ensure code is properly formatted.
```

All four must pass. A test that runs green but fails typechecking, linting, or formatting is not done.
