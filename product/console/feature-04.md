## Feature 04 — Snapshot-Aware Object Inspector

**Category:** Inspection
**Status:** ✅ Ready to implement
**Dependencies:** Feature 3 (extends the `writer` function)

### Why

Domain objects have **no getters** and **no public state** (Object Calisthenics). When the standard Node REPL prints a `Campaign` aggregate, it dumps internal protected fields and component classes (`CampaignFunding`, `Tiers`, `Donations`) — which is unreadable and violates the spirit of encapsulation.

The `.toSnapshot()` method is the **sanctioned serialization boundary** (Memento pattern, `DESIGN.md` §9). The console should use it automatically.

### Specification

Extend the `writer` function from Feature 3 with snapshot detection:

```typescript
function hasSnapshot(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    'toSnapshot' in value &&
    typeof (value as Record<string, unknown>).toSnapshot === 'function'
  )
}

function toSnapshot(value: unknown): unknown {
  return (value as { toSnapshot(): unknown }).toSnapshot()
}
```

Integrate into the writer pipeline, **after** Result unwrapping and **before** `util.inspect`:

```typescript
replServer.writer = (output: unknown): string => {
  // 1. Result unwrapping (Feature 3)
  if (isResult(output)) {
    const result = output as { error: unknown; value: unknown }
    if (result.error !== null) {
      return formatException(result.error as Exception)
    }
    output = result.value
  }

  // 2. Snapshot conversion for single domain objects
  if (hasSnapshot(output)) {
    output = toSnapshot(output)
  }

  // 3. Snapshot conversion for arrays of domain objects
  if (Array.isArray(output)) {
    output = output.map((item) => (hasSnapshot(item) ? toSnapshot(item) : item))
  }

  // 4. Final formatting
  return util.inspect(output, { colors: true, depth: 4, compact: false })
}
```

**Example: Before and After**

Without the snapshot inspector, inspecting a Campaign shows:

```
Campaign {
  _id: Id { value: 'ABC1234567' },
  name: CampaignName { value: 'My Campaign' },
  funding: CampaignFunding { tiers: Tiers { items: [Array] }, donations: Donations { items: [] } }
}
```

With the snapshot inspector:

```javascript
{
  id: 'ABC1234567',
  name: 'My Campaign',
  funding: {
    tiers: [ { id: 'XYZ9876543', name: 'Bronze', value: 10 } ],
    donations: []
  }
}
```

### Notes

- The snapshot conversion happens **after** Result unwrapping, so `Result<Campaign>` is first unwrapped to `Campaign`, then converted to `CampaignSnapshot`.
- `null` values (e.g., from `findById` returning `Result<Campaign | null>`) pass through safely.
- This does NOT violate `DESIGN.md` §9's rule that "Snapshots MUST NOT be used to read or inspect domain object internals" in application code. The console is an infrastructure concern (a developer tool). The rule exists to prevent application/domain code from using snapshots to bypass encapsulation.
