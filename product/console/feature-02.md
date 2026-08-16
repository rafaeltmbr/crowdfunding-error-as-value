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

1. Import all Domain classes (`Values` and `Entities`).
2. Instantiate `InMemory` repositories.
3. Instantiate `UseCases` by injecting the required repositories via constructor.
4. Expose them under `Values`, `Entities`, `Repositories`, and `UseCases` objects in the `replServer.context`.

```typescript
// Example wiring:
const campaignRepository = new CampaignRepositoryInMemory()
const supporterRepository = new SupporterRepositoryInMemory()

const createCampaign = new CreateCampaignUseCase(campaignRepository)
const makeDonation = new MakeDonationUseCase(campaignRepository, supporterRepository)

replServer.context['Repositories'] = {
  Campaign: campaignRepository,
  Supporter: supporterRepository,
}
replServer.context['UseCases'] = { CreateCampaign: createCampaign, MakeDonation: makeDonation }
```

### Important: Adding New Classes

**Whenever a new Value Object, Entity, Repository, or Use Case is added to the project, it MUST be manually imported and registered in `src/infra/console/Console.ts`.** The console will not automatically detect new classes.

### Testing

This integration relies on static imports and TypeScript's type-checker to ensure that Use Cases are provided with the correct dependencies. No complex unit tests are needed for discovery logic, and the console initialization test guarantees that the process starts cleanly.
