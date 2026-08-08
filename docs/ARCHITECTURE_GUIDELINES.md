# Architecture & Design Guidelines

This project strictly follows Pragmatic Domain-Driven Design (DDD), Clean Architecture, and Error-as-Value principles. The domain is pure, encapsulation is absolute, and invalid states are unrepresentable.

These guidelines are meant for both humans and LLMs. Follow them without exception.

## 1. Layering & Dependencies (Clean Architecture)

The dependency rule always points inward. Outer layers depend on inner layers; inner layers know nothing about outer layers.

- **Domain (`src/domain`)**: The core. Contains Entities, Value Objects, and Domain logic.
  - **Rule**: The Domain layer MUST NOT import anything from `src/app`, `src/infra`, or any framework/library. It is pure TypeScript. Enforced by ESLint (`import-x/no-restricted-paths`).
- **Application (`src/app`)**: Orchestration and Use Cases.
  - Contains Use Cases (Interactors) and Interface Definitions for external communication (Ports, like Repositories).
  - **Rule**: Can import from `src/domain`, but NOT from `src/infra`.
- **Infrastructure (`src/infra` - implied)**: Frameworks, databases, external APIs.
  - Contains implementations of Application interfaces (Adapters).
  - **Rule**: Can import from `app` and `domain`.

## 2. Error-as-Value (No Exceptions)

The project relies entirely on the **Result Pattern**.

- **Rule**: NEVER use `throw`. Exceptions are banned (`functional/no-throw-statements`).
- **Rule**: Any operation that can fail MUST return a `Result<T, E>`.
- **Rule**: Use `Result.succeed(value)` and `Result.fail(new Error('...'))`.
- **Rule**: You MUST handle `Result` returns. Unhandled results (floating results) will fail the build (`local/no-floating-result`).

## 3. Domain Objects (Entities & Value Objects)

We enforce Rich Domain Models. Anemic domain models (data bags with getters/setters) are strictly forbidden.

### Construction & Validity

- **Rule**: ALL Domain Objects (Entities and Value Objects) MUST have a `protected constructor`.
- **Rule**: Instantiation is only allowed via a static `make(...)` factory method.
- **Rule**: `make(...)` MUST validate all inputs and return a `Result<T>`. An object cannot exist in an invalid state.

### Encapsulation & Behavior

- **Rule**: NO Getters or Setters for internal state, unless strictly required for identity (e.g., `get id()`).
- **Rule**: State mutation or querying MUST happen through descriptive behavior methods (e.g., `campaign.makeDonation(...)`, not `campaign.donations.push(...)`).
- **Rule**: Entities encapsulate and orchestrate their internal Value Objects and child Entities.

### Specialization (Inheritance)

- **Rule**: Use inheritance to create specialized Value Objects with stricter validation rules (e.g., `TierName extends Name`, overriding `validate()` to enforce a minimum length, then calling `super.validate()`).

## 4. Serialization (The Snapshot Pattern)

Domain objects encapsulate behavior and state, making them incompatible with standard JSON serialization or ORM mapping.

- **Rule**: Every Domain Object MUST implement `toSnapshot(): TSnapshot` to export its state as a plain Data Transfer Object (DTO).
- **Rule**: Every Domain Object MUST implement `static fromSnapshot(snapshot: TSnapshot): Result<T>` to rehydrate from a DTO.
- **Rule**: `fromSnapshot` MUST re-validate the data (usually by delegating to `make()`). Never trust data coming from outside the domain (e.g., from a database).

## 5. Code Constraints (Object Calisthenics)

The project enforces strict code quality and simplicity metrics via ESLint:

- **No Undefined**: `undefined` is banned. Use `null` or a `Result/Option` type to represent absence of value.
- **Keep it Small**:
  - Max 1 level of indentation/depth per function (`max-depth: 1`).
  - Max 3 parameters per function (`max-params: 3`).
  - Max 10 statements per function (`max-statements: 10`).
  - Max 30 lines per function.
  - Max 300 lines per file.
- **Complexity**: Cyclomatic complexity must not exceed 10.
- **Spacing**: Always leave a blank line after `if`, `switch`, and loop statements for readability.

## 6. Testing Implications

Because of these strict architectural rules:

- You cannot mock internal state. You must test objects through their public API.
- You must thoroughly test serialization (`fromSnapshot` / `toSnapshot`) against corrupted data, as this is the primary boundary defense against database/API anomalies.
