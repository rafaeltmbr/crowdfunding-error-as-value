## Feature 03 — Result Auto-Unwrap & Exception Pretty-Print

**Category:** Result Monad Integration
**Status:** ✅ Ready to implement
**Dependencies:** Feature 1

### Why

Since every fallible operation returns `Result<T>`, interacting with the console without auto-unwrapping means the developer constantly sees `Success { value: [Object], error: null }` wrapper objects. This is the single feature that transforms the console from tedious to ergonomic.

The Error-as-Value discipline is enforced at **compile time** (ESLint rules `functional/no-throw-statements` and `local/no-floating-result`). At runtime in the REPL, there is no application to crash. Errors become pretty-printed feedback, not silent failures.

### Specification

Override the REPL's default `writer` function. The `writer` is called on every expression result before printing it to the terminal. It only affects **display** — it does not modify the actual REPL context or variable bindings. The developer can still assign `const r = await UseCases.CreateCampaign.execute(...)` and inspect `r.error` or `r.value` manually.

**Result detection:**

The `Result<T>` type is a discriminated union (`Success<T> | Failure`). Detect it structurally without `instanceof`:

```typescript
function isResult(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false
  return 'error' in value && 'value' in value
}
```

This detects both `Success` (where `error === null`) and `Failure` (where `value === null`).

**Exception formatting:**

The `Exception` class has protected fields, so use `.toSnapshot()` (the sanctioned serialization boundary) to extract its data. Use `.message()` for the human-readable summary:

```typescript
function formatException(exception: Exception): string {
  const snapshot = exception.toSnapshot()

  const groupColors: Record<string, string> = {
    Validation: '\x1b[33m', // Yellow
    NotFound: '\x1b[34m', // Blue
    Infrastructure: '\x1b[31m', // Red
    Unexpected: '\x1b[35m', // Magenta
  }
  const reset = '\x1b[0m'
  const color = groupColors[snapshot.group] ?? reset

  let output = `${color}✗ ${snapshot.group}${reset} [${snapshot.code}]`
  if (snapshot.args.length > 0) {
    output += ` args: ${JSON.stringify(snapshot.args)}`
  }
  output += `\n${color}  ${exception.message()}${reset}`

  if (snapshot.stackTrace.length > 0) {
    const relevantLines = snapshot.stackTrace.slice(0, 5)
    output += '\n  ' + relevantLines.join('\n  ')
  }

  return output
}
```

**Writer pipeline:**

```typescript
replServer.writer = (output: unknown): string => {
  // 1. Result unwrapping
  if (isResult(output)) {
    const result = output as { error: unknown; value: unknown }
    if (result.error !== null) {
      return formatException(result.error as Exception)
    }
    output = result.value
  }

  // 2. Snapshot conversion — see Feature 4
  // ...

  return util.inspect(output, { colors: true, depth: 4 })
}
```

**Handling `Promise<Result<T>>`:**

Use Cases return `Promise<Result<T>>`. The Node REPL's built-in top-level `await` support resolves the Promise before passing the resolved value to `writer`. No special handling for Promises is needed.

### Notes

- The `Exception` class's `.message()` method accepts an optional `ErrorTemplate` function for i18n. The console uses the default (no template), which outputs `[Group] CODE: arg1, arg2`. If the project adds i18n templates later, the console's `formatException` can be updated to pass a template function.
- The color codes use raw ANSI escape sequences. No chalk/colors dependency is needed.

### Testing

- **Unit Testable:** Yes. `isResult`, `formatException`, and the `writer` proxy function can be tested by providing mocked Results and Exceptions and asserting the string output.
