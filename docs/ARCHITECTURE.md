# Architecture

This document describes the **strategic, system-wide decisions** that shape this project. These decisions are hard to reverse and affect every layer. If you need tactical, class-level patterns, see `DESIGN.md`.

These guidelines are meant for both humans and LLMs. Follow them without exception.

## 1. Architectural Style: Ports and Adapters (Hexagonal Architecture)

The system follows **Ports and Adapters**. The domain is at the center, fully isolated from infrastructure concerns. Communication with the outside world happens exclusively through interfaces (Ports) defined by the application layer, implemented by adapters in the infrastructure layer.

The system is organized in three layers:

- **Domain**: Pure TypeScript. Zero external dependencies. Contains Entities, Value Objects, Aggregates, and domain logic.
- **Application**: Orchestration. Contains Use Cases (Services) and Port definitions (Repository interfaces). The Application layer ONLY communicates using Domain Objects (Entities and Value Objects). It does not deal with raw primitives for domain concepts.
- **Infrastructure**: Adapters that implement Ports. Contains database clients, external API integrations, framework glue. This layer is responsible for parsing raw primitives (e.g., from HTTP requests or databases) into proper Domain Objects before passing them inward.

## 2. The Dependency Rule

Dependencies always point **inward**. Outer layers depend on inner layers; inner layers know nothing about outer layers.

- **Rule**: The Domain layer MUST NOT import from the Application or Infrastructure layers.
- **Rule**: The Application layer MUST NOT import from the Infrastructure layer.
- **Rule**: The Infrastructure layer MAY import from the Application and Domain layers.
- **Enforcement**: These boundaries are enforced at build time by ESLint (`import-x/no-restricted-paths`). Violations fail the build.

## 3. Bounded Context

The project models a single implicit Bounded Context: **Crowdfunding**.

All domain concepts belong to this context. There are no cross-context integrations or anti-corruption layers.

## 4. Port and Adapter Boundary

Ports are TypeScript interfaces defined in the **application layer**. They describe what the application needs from the outside world, not how it gets it.

- **Rule**: Port interfaces MUST live in the application layer.
- **Rule**: Port return types MUST use `Promise<Result<T>>` to keep error handling consistent across sync and async boundaries.
- **Rule**: Adapters (implementations) MUST live in the infrastructure layer or, for testing, alongside tests.

## 5. Use Cases & Application Layer Responsibilities

Use Cases orchestrate execution flow across domain aggregates and application ports.

- **Rule**: Use Cases are strictly responsible for **cross-aggregate logic and orchestration** (e.g., enforcing cross-aggregate invariants, coordinating persistence).
- **Rule**: Use Cases MUST NOT perform intra-aggregate domain validation or construct/validate internal child entities directly — that responsibility belongs exclusively to the Aggregate Root.
