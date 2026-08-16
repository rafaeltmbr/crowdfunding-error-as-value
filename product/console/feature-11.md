## Feature 11 — Multiline Input Support

**Category:** REPL UX
**Status:** ✅ Mostly built-in
**Dependencies:** Feature 1

### Why

Use Case `.execute()` calls accept objects with multiple properties. Writing them on a single line is uncomfortable. Multiline input lets the developer write naturally across multiple lines.

### Specification

Node's built-in REPL already supports multiline input when it detects an incomplete expression (unclosed brackets, parentheses, template literals). It shows `...` as a continuation prompt.

**No code needed** — this works out of the box as long as the default `eval` function is not overridden in a way that breaks incomplete-expression detection.

If a custom `eval` is used (e.g., for TypeScript support — Feature 10), it must check for `Recoverable` errors from the `node:repl` module and re-throw them so the REPL waits for more input:

```typescript
import { Recoverable } from 'node:repl'

// Inside custom eval, when evaluation fails:
if (isIncompleteExpression(err)) {
  callback(new Recoverable(err as Error), undefined)
}
```

### Notes

- If the default `eval` is kept (no TypeScript REPL), this is a zero-effort feature.
