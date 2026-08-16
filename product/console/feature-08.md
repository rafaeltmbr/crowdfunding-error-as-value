## Feature 08 — `clear()` Function

**Category:** Data
**Status:** ⚠️ Needs a `clear()` method on InMemory adapters
**Dependencies:** Feature 2

### Why

Pairs with `seed()`. When the developer wants to start fresh after testing a scenario, they need a way to wipe in-memory state without restarting the console.

### Specification

**The challenge:** `CampaignRepositoryInMemory` and `SupporterRepositoryInMemory` store data in `private collection: Snapshot[] = []`. There is no public method to reset this array.

**Recommended approach:** Add a `clear(): void` method to each InMemory adapter that resets the collection. This method is NOT part of the Repository Port interface — it is specific to the InMemory implementation. Production database adapters would never need this.

```typescript
// In CampaignRepositoryInMemory.ts:
clear(): void {
  this.collection = []
}

// In SupporterRepositoryInMemory.ts:
clear(): void {
  this.collection = []
}
```

The console's `clear()` function iterates over all repo instances:

```typescript
function clear(): void {
  for (const repo of Object.values(Repositories)) {
    if (repo && typeof (repo as Record<string, unknown>).clear === 'function') {
      ;(repo as { clear(): void }).clear()
    }
  }
  console.log('✓ All repositories cleared.')
}

replServer.context.clear = clear
```

This approach is resilient to new repositories: as long as new InMemory adapters also implement `clear()`, they are automatically included in the reset.

### Notes

- The `clear()` method is discovered dynamically by checking `typeof repo.clear === 'function'`. No hardcoded list of repositories.
- The Port interface (`CampaignRepository`) remains unchanged. The `clear()` method exists only on the concrete `CampaignRepositoryInMemory` class.
- **Pre-requisite:** Before implementing this feature, add the `clear()` method to both `CampaignRepositoryInMemory` and `SupporterRepositoryInMemory`.
