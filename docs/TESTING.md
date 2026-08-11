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
- `toBeFailureWithCode('EXACT_CODE')` — asserts the result failed with the exact exception code. This is the **primary matcher** for validation specs.
- `toBeFailureOfGroup(ExceptionGroup)` — asserts `result.error.belongToGroup(ExceptionGroup)`. Use this to verify the error **kind** without coupling to the exact code. Useful for behavior/integration tests (e.g., distinguishing NotFound from Validation).

Always use `toBeFailureWithCode(...)` for validation tests to pin exact error codes. Use `toBeFailureOfGroup(...)` alongside code checks when the error group is semantically important.

```typescript
// GOOD: asserts code
expect(result).toBeFailureWithCode('CAMPAIGN_NAME_MIN_LENGTH')

// GOOD: asserts group only (behavior test, specific code not important)
expect(result).toBeFailureOfGroup(ExceptionGroup.NotFound)

// BAD: too loose
expect(result.error).not.toBeNull()
```

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
- Test every validation rule with its exact error code using `toBeFailureWithCode('...')`.
- Test boundary values (minimum length, single character, zero, etc.).
- If the method normalizes input (e.g., collapsing whitespace), test with tabs `\t`, newlines `\n`, and erratic spaces.

```typescript
// GOOD
expect(result).toBeFailureWithCode('NAME_EMPTY')

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
- Test every rejection path with exact error code.
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
3. **Invalid data**: test at least one corrupted input per distinct validation path, using `toBeFailureWithCode('...')`. When `fromSnapshot` delegates to `make`, a representative subset is sufficient — do not duplicate all `make` tests.

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

## Mocking and Defensive Code

Because the project enforces strict 100% test coverage, you must test even "unreachable" defensive branches (e.g., handling deserialization failures on perfectly valid internal data).

- **Do NOT use `/* v8 ignore next */`**. Instead of ignoring defensive code, simulate the failure using test spies.
- Use `vi.spyOn(Class, 'method').mockReturnValue(...)` to force an error state without mutating private internal collections.
- Always use `vi.restoreAllMocks()` in an `afterEach` block if you are using spies to prevent cross-test contamination.
- Use `toBeFailureWithCode(...)` to assert that your mocked error was correctly caught and returned by the adapter or service.

## Workflow

Every time a test is created or modified, the validation script must pass:

```bash
npm run validate
```

A test that runs green but fails typechecking, linting, or formatting is not done.
