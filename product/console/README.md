# Console Requirements

This document specifies the features for an interactive REPL console that provides a Rails Console-like experience tailored to this project's architecture (Hexagonal Architecture, Error-as-Value, Object Calisthenics, In-Memory Data Layer).

The console allows developers to interact with the application's Domain, Application, and Infrastructure layers directly from a terminal prompt — creating entities, executing use cases, inspecting state, and experimenting with the domain model — all without writing throwaway scripts.

## Context

- The project uses **TypeScript** with **ESM modules** (`"type": "module"`).
- `tsx` is already a devDependency and is used for the `dev` script. It resolves path aliases (`@app/*`, `@entities/*`, `@values/*`, `@infra/*`) by reading `tsconfig.json` automatically.
- All fallible operations return `Result<T>` (a discriminated union of `Success<T> | Failure<Exception>`). Exceptions are never thrown — this is enforced at compile time by ESLint (`functional/no-throw-statements` and `local/no-floating-result`).
- Domain objects have **no getters** (except `get id()` on Entities) and **no setters**. The only way to inspect their state is through `.toSnapshot()`.
- Repositories are **in-memory** adapters that store `Snapshot[]` arrays internally.
- Dependencies are wired manually — no DI framework. The project will eventually have hand-written factories for use cases and infrastructure adapters (e.g., repositories with file-backed persistence via `load()`/`dump()`), but those do not exist yet.
- **Zero new dependencies.** The console is built entirely with Node.js built-in modules (`node:repl`, `node:fs`, `node:path`, `node:util`, `node:url`) and the existing `tsx` devDependency.

## Architectural Decision

The console is an **infrastructure concern** — it is a developer-facing adapter that wraps the application layer. Following the Hexagonal Architecture, it lives inside the infrastructure layer:

```
src/infra/console/
```

It is allowed to import from the Application and Domain layers (per the Dependency Rule in `ARCHITECTURE.md`).

## Namespace Convention

All classes are organized by their architectural nature in the REPL context. The developer accesses them through scoped namespaces:

| Namespace | Source Directory          | Contents                                | Example                               |
| --------- | ------------------------- | --------------------------------------- | ------------------------------------- |
| `Values`      | `src/domain/values/`      | Value Object classes (static factories) | `Values.Name.make('Alice')`               |
| `Entities`  | `src/domain/entities/`    | Entities classes (static factories)       | `Entities.Campaign.make(name)`          |
| `UseCases` | `src/app/use_cases/`      | Use Case **instances** (pre-wired)      | `UseCases.CreateCampaign.execute(...)` |
| `Repositories`    | `src/infra/repositories/` | Repository **instances** (pre-wired)    | `Repositories.Campaign.findById(id)`          |

> **Note on `Values` vs `Object`:** The namespace for Value Objects is `Values`, not `Object`. Using `Object` would shadow JavaScript's global `Object` built-in, breaking `Object.keys()`, `Object.entries()`, and every other `Object.*` method. `Values` is the standard abbreviation for Value Object in DDD literature.

### Namespace Key Derivation

Keys are derived automatically from class names using naming conventions. No manual mapping is needed:

| Layer         | Class Name                   | Strip Suffix         | Namespace Key            |
| ------------- | ---------------------------- | -------------------- | ------------------------ |
| Value Objects | `Email`                      | —                    | `Values.Email`               |
| Value Objects | `ExceptionGroup`             | —                    | `Values.ExceptionGroup`      |
| Entities      | `Campaign`                   | —                    | `Entities.Campaign`        |
| Repositories  | `CampaignRepositoryInMemory` | `RepositoryInMemory` | `Repositories.Campaign`          |
| Use Cases     | `CreateCampaignUseCase`      | `UseCase`            | `UseCases.CreateCampaign` |

For Value Objects and Entities, **all named exports** from each file are flattened into the namespace. TypeScript-only exports (`type`, `interface`) are erased at compile time and do not appear. Internal/unexported classes (e.g., `CampaignName`, `Tiers`) are not exported from the module and do not appear either.

Current expected REPL context after auto-discovery:

```
Values.Name               → Name class
Values.Email              → Email class
Values.Id                 → Id class
Values.Money              → Money class
Values.Result             → Result factory (const ResultBase)
Values.Success            → Success class
Values.Failure            → Failure class
Values.Exception          → Exception class
Values.ExceptionGroup     → ExceptionGroup enum

Entities.Campaign         → Campaign class
Entities.Supporter        → Supporter class
Entities.Tier             → Tier class
Entities.Donation         → Donation class

Repositories.Campaign     → CampaignRepositoryInMemory instance
Repositories.Supporter    → SupporterRepositoryInMemory instance

UseCases.CreateCampaign   → CreateCampaignUseCase instance (wired)
UseCases.CreateSupporter  → CreateSupporterUseCase instance (wired)
UseCases.MakeDonation     → MakeDonationUseCase instance (wired)
```


## Features

- [Feature 01 — Console Entry Script & NPM Script](./feature-01.md)
- [Feature 02 — Auto-Discovery & Composition Root](./feature-02.md)
- [Feature 03 — Result Auto-Unwrap & Exception Pretty-Print](./feature-03.md)
- [Feature 04 — Snapshot-Aware Object Inspector](./feature-04.md)
- [Feature 05 — Persistent Command History](./feature-05.md)
- [Feature 06 — Welcome Banner](./feature-06.md)
- [Feature 07 — `seed()` Function](./feature-07.md)
- [Feature 08 — `clear()` Function](./feature-08.md)
- [Feature 09 — Custom REPL Dot-Commands](./feature-09.md)
- [Feature 10 — TypeScript-Aware REPL](./feature-10.md)
- [Feature 11 — Multiline Input Support](./feature-11.md)
- [Feature 12 — `reload!()` — Hot Code Reloading](./feature-12.md)
- [Feature 13 — `.env` Loading](./feature-13.md)
