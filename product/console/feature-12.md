## Feature 12 — `reload!()` — Hot Code Reloading

**Category:** Developer Workflow
**Status:** ⚠️ Complex — defer until frequently needed
**Dependencies:** Feature 2

### Why

When the developer edits domain logic or use case orchestration in their editor, they currently have to restart the console to pick up changes. `reload!()` would invalidate the module cache, re-import all modules, and re-wire the Composition Root — while preserving the in-memory repository state.

### Specification

**High-level flow:**

1. **Serialize current state.** For each InMemory repository, extract the current snapshot collection. This requires either a `dump()` method on the adapters (which the user plans to introduce eventually) or direct access to the `collection` field.
2. **Invalidate ESM module cache.** For ESM modules, Node does not provide `require.cache` invalidation. The approach is to use dynamic `import()` with a cache-busting query parameter: `await import(filePath + '?t=' + Date.now())`.
3. **Re-run auto-discovery.** Call the same scanner functions from Feature 2 with the cache-busted imports.
4. **Rehydrate state.** Load the serialized snapshots into the freshly instantiated repositories.
5. **Update REPL context.** Replace `replServer.context.Values`, `.Entities`, `.Repo`, `.UseCases` with the new namespace objects.

**Attach to context:**

```typescript
replServer.context['reload!'] = reload
```

### Notes

- **ESM cache busting is fragile.** The `?t=` trick works for dynamic `import()` but may cause issues with Node's module resolution, especially with path aliases. Thorough testing is needed.
- **State preservation requires `dump()`/`load()` on repositories.** The user plans to introduce these methods eventually. Until then, `reload!()` would lose in-memory state.
- **Recommendation:** Defer this feature. Restarting the console is fast for a project of this size. Implement when the developer frequently finds themselves restarting during active domain development AND repository `dump()`/`load()` methods exist.
