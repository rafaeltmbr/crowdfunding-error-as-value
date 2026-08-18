# Testing

Reference implementation: `tests/domain/values/Name.test.ts`.

## Principles

- Tests are executable specifications. A reader must understand class behavior from the test file alone.
- Explicit over implicit: import `describe`, `expect`, `it`, `beforeEach` from `vitest`. Globals are disabled.
- Verify exact error messages, exact snapshot structures, exact return values.
- One logical behavior per `it(...)` block. Multiple `expect()` calls are fine if they verify facets of the same behavior.
- Tests must be deterministic and self-contained. Use `beforeEach` to reset mutable state. Never rely on execution order.

## Coverage Philosophy

Coverage is a **signal, not a goal**. The project does not enforce a minimum coverage threshold. A test suite that hits 100% by mocking infrastructure errors in every branch is not more valuable than one that clearly documents real business scenarios.

What actually matters:

- Every use case has its **happy path** tested end-to-end.
- Every meaningful **business failure** (entity not found, duplicate, domain rule violation) is tested through the public API with real in-memory adapters.
- Edge cases (empty collections, boundary values) are covered where they represent genuinely distinct behaviors.

Do **not** write tests purely to pump coverage numbers. A test that only exists to exercise an `if (result.error) return result` guard inside a repository method (via a mocked infrastructure failure) adds noise, not signal.

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

### Use Cases (Application Layer)

Use-case tests are **scenario tests**: they wire a use case to real in-memory adapters and run it as a user would. They do not mock repository methods to simulate infrastructure failures — that is noise. Focus on:

- **Happy path**: the full success flow, assert the returned value and that state was actually persisted.
- **Entity-not-found**: pass an ID that does not exist in the repository; assert the correct `NotFound` error code.
- **Duplicate / uniqueness violation**: pre-seed the repository with conflicting data; assert the correct `Validation` error code.
- **Domain rule violations**: pass inputs that violate a domain constraint the use case is responsible for enforcing (e.g., minimum name length for a specific aggregate type, non-positive donation amount).

Do **not** spy on repository methods to return `Result.fail(...)`. If a path can only be reached via an infrastructure failure, it is an infrastructure concern tested at the adapter level, not here.

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

## Mocking

**Avoid mocking where possible**. Use real instances, in-memory adapters, or child processes. Reserve mocking strictly for simulating conditions that cannot be triggered through the public API (e.g., a corruption scenario inside a serialization step).

- **Do NOT use `/* v8 ignore next */`**. Prefer to either reach the branch naturally or omit it from the test suite if it has no meaningful business scenario.
- Use `vi.spyOn(Class, 'method').mockReturnValue(...)` to force an error state that cannot be triggered via real inputs.
- Always add `afterEach(() => { vi.restoreAllMocks() })` whenever spies are used to prevent cross-test contamination.
- Use `toBeFailureWithCode(...)` to assert that the mocked error is correctly handled.

## Workflow

Every time a test is created or modified, the validation script must pass:

```bash
npm run validate
```

A test that runs green but fails typechecking, linting, or formatting is not done.
