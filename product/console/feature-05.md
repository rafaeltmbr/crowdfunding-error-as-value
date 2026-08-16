## Feature 05 — Persistent Command History

**Category:** REPL UX
**Status:** ✅ Ready to implement
**Dependencies:** Feature 1

### Why

Without persistent history, every console restart loses all previously typed commands. This is especially painful when commands involve constructing multiple Value Objects. Persistent history is table-stakes UX for any interactive console.

### Specification

After creating the REPL server, call the built-in `setupHistory` method:

```typescript
replServer.setupHistory('.console_history', (err) => {
  if (err) console.error('Failed to load console history:', err)
})
```

Add `.console_history` to `.gitignore`:

```
.console_history
```

### Notes

- `setupHistory` is a built-in `node:repl` method. No dependencies needed.
- The history file is plain text, one command per line.
