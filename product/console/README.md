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

## Guidelines

When developing features for the console, you MUST strictly adhere to the project's core documentation:

- [Agent Instructions](../../AGENTS.md)
- [Architecture Guidelines](../../docs/ARCHITECTURE.md)
- [Design Patterns](../../docs/DESIGN.md)
- [Testing Standards](../../docs/TESTING.md)

Any code added to the console must follow these rules, including 100% test coverage and proper architectural layering.

## Architectural Decision

The console is an **infrastructure concern** — it is a developer-facing adapter that wraps the application layer. Following the Hexagonal Architecture, it lives inside the infrastructure layer:

```
src/infra/console/
```

It is allowed to import from the Application and Domain layers (per the Dependency Rule in `ARCHITECTURE.md`).

## Testing Strategy

Every console feature should have tests when possible. The console is an infrastructure adapter, and its utility functions, formatting logic, and wiring must be verified to prevent regressions and ensure the REPL remains stable as the application evolves.

- Pure utility functions (e.g., Result unwrapping, snapshot detection) MUST be unit tested.
- Functions with side effects (e.g., `seed()`, `clear()`) MUST be tested by asserting the state changes in the in-memory repositories.
- The REPL wiring itself can be integration-tested by spawning a console instance, though this is optional compared to testing the isolated functions.

## Context Registration

All Domain classes, Use Cases, and Repositories are exposed directly in the REPL context. Because the exported classes represent unique concepts, there is no name collision.

Developers access them by their full names:

- **Value Objects:** `Name.make('Alice')`
- **Entities:** `Campaign.make(name)`
- **Use Cases:** `const createCampaign = new CreateCampaignUseCase(repo); createCampaign.execute(...)`
- **Repositories:** `const repo = new CampaignRepositoryInMemory()`

Current expected REPL context after initialization:

```
Name                        → Name class
Email                       → Email class
Id                          → Id class
Money                       → Money class
Result                      → Result factory (const ResultBase)
Success                     → Success class
Failure                     → Failure class
Exception                   → Exception class
ExceptionGroup              → ExceptionGroup enum

Campaign                    → Campaign class
Supporter                   → Supporter class
Tier                        → Tier class
Donation                    → Donation class

CampaignRepositoryInMemory  → CampaignRepositoryInMemory class
SupporterRepositoryInMemory → SupporterRepositoryInMemory class

CreateCampaignUseCase       → CreateCampaignUseCase class
CreateSupporterUseCase      → CreateSupporterUseCase class
MakeDonationUseCase         → MakeDonationUseCase class
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
