## Feature 09 — Custom REPL Dot-Commands

**Category:** REPL UX
**Status:** ✅ Ready to implement
**Dependencies:** Priorities 7 and 8

### Why

Dot-commands (`.seed`, `.clear`) are faster to type than function calls and appear in the built-in `.help` output, making them discoverable.

### Specification

Register custom commands via the built-in `replServer.defineCommand()`:

```typescript
replServer.defineCommand('seed', {
  help: 'Populate repositories with sample data',
  action() {
    seed().then(() => this.displayPrompt())
  },
})

replServer.defineCommand('clear', {
  help: 'Reset all repositories to empty state',
  action() {
    clear()
    this.displayPrompt()
  },
})
```

### Notes

- `.help` is built into Node's REPL and automatically lists all registered commands with their `help` text.
- `this.displayPrompt()` must be called after each action to restore the prompt.
- `seed()` is async (it calls Use Cases), so it uses `.then()`. `clear()` is synchronous.
