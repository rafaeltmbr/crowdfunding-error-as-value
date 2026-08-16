## Feature 02 — Composition Root

**Category:** Bootstrap
**Status:** ✅ Implemented
**Dependencies:** Feature 1

### Why

The console needs to have access to all Value Objects, Entities, Repositories, and Use Cases so the developer can interact with the system manually. This requires a Composition Root that instantiates the adapters and wires them into the Use Cases, and then exposes them to the REPL.

### Specification

Instead of complex auto-discovery, we use explicit, manual imports. This drastically simplifies the codebase, avoids "magic", and keeps the setup deterministic and easy to follow.

#### Manual Registration

When the console starts, it will:

1. Import all Domain classes (Value Objects and Entities).
2. Import all Use Case and Repository classes.
3. Expose them directly in the `replServer.context`.

```typescript
Object.assign(replServer.context, {
  CampaignRepositoryInMemory,
  SupporterRepositoryInMemory,
  CreateCampaignUseCase,
  MakeDonationUseCase,
})
```

### Important: Adding New Classes

**Whenever a new Value Object, Entity, Repository, or Use Case is added to the project, it MUST be manually imported and registered in `src/infra/console/Console.ts`.** The console will not automatically detect new classes.

### Testing

This integration relies on static imports and TypeScript's type-checker to ensure that Use Cases are provided with the correct dependencies. No complex unit tests are needed for discovery logic, and the console initialization test guarantees that the process starts cleanly.
