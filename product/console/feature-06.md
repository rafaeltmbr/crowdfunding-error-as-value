## Feature 06 — Welcome Banner

**Category:** REPL UX
**Status:** ✅ Ready to implement
**Dependencies:** Feature 2 (uses discovery results to generate banner content)

### Why

When a developer opens the console for the first time, they need to know what's available. The banner must be **auto-generated** from the discovery results so it stays in sync with the codebase without manual updates.

### Specification

After the auto-discovery phase (Feature 2) has run, build the banner dynamically from the namespace keys:

```typescript
function printBanner(
  values: Record<string, unknown>,
  entities: Record<string, unknown>,
  repo: Record<string, unknown>,
  useCase: Record<string, unknown>
): void {
  const valueKeys = Object.keys(values).join(', ')
  const entityKeys = Object.keys(entities).join(', ')
  const repoKeys = Object.keys(repo)
    .map((k) => `Repositories.${k}`)
    .join(', ')
  const useCaseKeys = Object.keys(useCase)
    .map((k) => `UseCases.${k}`)
    .join(', ')

  console.log(`
  ┌──────────────────────────────────────────┐
  │         Crowdfunding Console             │
  ├──────────────────────────────────────────┤
  │                                          │
  │  Values:       ${valueKeys}              │
  │  Entities:     ${entityKeys}             │
  │  Repositories: ${repoKeys}               │
  │  UseCases:     ${useCaseKeys}            │
  │                                          │
  │  Helpers:      seed(), clear()           │
  │  Commands:     .help, .seed, .clear      │
  └──────────────────────────────────────────┘
  `)
}
```

Call `printBanner(Values, Entities, Repositories, UseCases)` immediately before `repl.start(...)`.

### Notes

- Since the banner reads the namespace keys, adding a new Use Case or Entities automatically updates the banner. No manual maintenance.
- The banner formatting shown above is a starting point. The implementer should adjust padding and alignment to fit the actual content width. The key requirement is that it lists all available namespaces and their keys.
