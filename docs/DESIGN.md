# Design

This document describes the **tactical, class-level patterns** used within this project. These are localized decisions about how individual components are built. For system-wide, structural decisions, see `ARCHITECTURE.md`.

These guidelines are meant for both humans and LLMs. Follow them without exception.

## 1. Core Philosophy: Rich Object-Oriented Domain

This project enforces strict OO principles to produce **rich, behavioral domain models**. Anemic domain models — objects that are mere data bags with getters and setters — are forbidden. Domain objects MUST encapsulate both state and behavior. The outside world interacts only through descriptive methods.

## 2. Error-as-Value: The Result Pattern

The project bans exceptions entirely. All fallible operations return a `Result<T>` discriminated union.

- **Rule**: NEVER use `throw`. Enforced by ESLint (`functional/no-throw-statements`).
- **Rule**: Any operation that can fail MUST return a `Result<T>`.
- **Rule**: Use `Result.succeed(value)` for success and `Result.fail(new Error('...'))` for failure.
- **Rule**: You MUST handle every `Result`. Unhandled results fail the build (`local/no-floating-result`).
- **Rule**: Narrow errors with `if (result.error) return result` before accessing `result.value`. The discriminated union guarantees type-safe access after narrowing.
- **Rule**: Use `null` or `Result` to represent absence. `undefined` is banned in both runtime code and type annotations.

```typescript
// GOOD: Result narrowing
const name = CampaignName.make(props.name)
if (name.error) return name
// name.value is now safely accessible

// BAD: throw
if (!isValid) throw new Error('...')
```

### Error Hierarchy

Errors are **domain primitives** — immutable signal objects that carry structured information about what went wrong. They live in `src/domain/values/DomainError.ts` alongside `Result.ts`. They are **not** Value Objects — they have no `make()`, `isEqual()`, or `toSnapshot()`.

- **Rule**: All domain error classes MUST extend the abstract `DomainError` base class.
- **Rule**: Each error category class carries a `readonly tag` literal for discriminated union narrowing (e.g., `switch(error.tag)` for HTTP status mapping).
- **Rule**: Errors use **inheritance for granularity control**. Fine-grained leaf classes extend broad category classes. The producer is always specific (returns the leaf type); the consumer chooses the basket (widens the return type to the parent category).
- **Rule**: Leaf error classes that are scoped to a single module SHOULD be **unexported and internal** (same rule as specialized Value Objects).
- **Rule**: Leaf error classes that belong to shared base Value Objects (e.g., `Name`, `Email`) MUST be exported.
- **Rule**: `ValidationError` carries a `code` (stable i18n key) and `params` (interpolation variables) for internationalization support. The `message` is a developer-facing English fallback.

```
Error (built-in)
└── DomainError (abstract — tag protocol)
    ├── ValidationError (code, message, params)
    │   ├── EmptyNameError (leaf — shared)
    │   ├── ShortCampaignNameError (leaf — unexported)
    │   └── ...
    └── NotFoundError (entity)
```

```typescript
// GOOD: producer is specific, consumer widens the basket
// Inside CampaignName (internal module):
return Result.fail(new ShortCampaignNameError())

// Campaign.make return type widens to the category:
static make(name: string): Result<Campaign, ValidationError>

// Consumer narrows via instanceof when needed:
if (result.error instanceof ValidationError) { /* 400 */ }
```

## 3. Object Calisthenics

Object Calisthenics is used as a discipline to **force out of the procedural mindset into the OO paradigm**. The ESLint configuration enforces specific numeric limits (indentation depth, function size, complexity, etc.), but the following principles are the conceptual drivers behind those rules:

- **Tell, Don't Ask**: Do not query an object's state to make decisions on its behalf. Tell the object what to do and let it decide how. This keeps behavior inside the object that owns the data.
- **One level of indentation per method**: Keeps methods simple and prevents leaking knowledge about object internal structures. There are exceptions, but deep nesting is a sign of procedural thinking.
- **Early Return and Fail Fast (Guard Clauses)**: Avoid `else` blocks and deeply nested conditions. If a validation fails or a cached value exists, return or fail immediately. This flattens the code and keeps the "happy path" completely unindented.
- **Avoid primitive obsession**: Wrap primitive values in Value Objects that carry meaning and validation. A `Money` is not a `number`; a `Name` is not a `string`.
- **First-class collections**: Raw arrays of domain objects MUST NOT be exposed. Wrap them in collection classes that expose domain-meaningful methods and enforce their own invariants (e.g., rejecting duplicates, maintaining sort order).
- **No getters**: Do not expose internal state through getters. The only exception is `get id()` on Entities that need to be referenced externally (e.g., by the application layer through repository queries).
- **No setters**: Never write setters. Prefer behavior methods with descriptive names that express the action being performed.

## 4. Value Objects

Value Objects are immutable domain primitives that represent a concept with no identity. Two Value Objects are equal if their content is equal.

### Construction

- **Rule**: ALL Value Objects MUST have a `protected constructor`.
- **Rule**: Instantiation is only allowed via a static `make(...)` factory method.
- **Rule**: `make(...)` MUST validate all inputs and return a `Result<T>`. A Value Object cannot exist in an invalid state.
- **Rule**: Input normalization (trimming, whitespace collapsing, lowercasing) happens inside `make` before validation.

### Equality and Comparison

- **Rule**: Value Objects MUST implement `isEqual(other): boolean`.
- **Rule**: Additional comparison methods (e.g., `isLessThan`, `plus`) are added when the domain requires them.

## 5. Specialization via Inheritance

Value Objects use inheritance to create domain-specific variants with stricter validation. The base class provides shared logic; subclasses override `validate()` to add constraints, then delegate to `super.validate()`.

- **Rule**: Specialized Value Objects MUST override `validate()` to add their constraints and call `super.validate()` for the base rules.
- **Rule**: Specialized Value Objects MUST override `make()` to return the correct subclass type.
- **Rule**: Specialized Value Objects that are scoped to a single Entity SHOULD be **unexported and internal** to that Entity's module file.

## 6. Entities

Entities are domain objects with a unique identity (`Id`). Two Entities are equal if their identity is equal, regardless of their other attributes.

- **Rule**: Entities MUST have a `protected constructor`.
- **Rule**: Entity identity is an `Id` Value Object. Equality is based solely on `id.isEqual(other.id)`.
- **Rule**: Entities MUST implement `hasId(id: Id): boolean` to allow external querying by identity (e.g., inside repositories).
- **Rule**: All state access and mutation goes through behavior methods.

### Cross-Aggregate References by Identity

Within an Aggregate, entities hold **direct references** (in-memory) to their children. However, references to entities that belong to a **different Aggregate** MUST be by identity (`Id`), not by direct object reference.

- **Rule**: Cross-aggregate references MUST use `Id` values, never direct object references.
- **Rule**: Holding an `Id` to an external entity is not the same as accessing it. It is a reference only — the object behind the `Id` is resolved through a Repository when needed, never accessed or modified directly.

This preserves Aggregate boundaries: an Aggregate cannot accidentally reach into another Aggregate's internals through a direct reference.

## 7. Aggregate Root

An Aggregate Root is the only entry point for modifying its child entities. External code never directly creates or modifies children.

- **Rule**: Child entities MUST NOT be created or modified outside the Aggregate Root.
- **Rule**: All invariants spanning multiple children are enforced by the Aggregate Root.

## 8. Component Delegation

To respect Object Calisthenics limits, Aggregate Roots and Entities delegate internal responsibilities to **component classes**. These are unexported, internal classes that encapsulate a specific concern.

- **Rule**: Component classes are private to the module. They are never exported or used outside their parent.
- **Rule**: Components MUST follow the same OO principles (encapsulation, behavior methods, no public state).

## 9. The Snapshot Pattern — Memento (Serialization Boundary)

Domain objects encapsulate state, making them incompatible with JSON serialization or ORM mapping. The Snapshot pattern (Memento) provides a controlled serialization boundary for **persistence and transport purposes only** — it is not a means to bypass encapsulation or access internal state.

- **Rule**: Every Domain Object MUST implement `toSnapshot(): TSnapshot` to export state as a plain DTO.
- **Rule**: Every Domain Object MUST implement `static fromSnapshot(snapshot: TSnapshot): Result<T>` to rehydrate from a DTO.
- **Rule**: `fromSnapshot` MUST re-validate data (typically by delegating to `make()`). Never trust data from outside the domain.
- **Rule**: Snapshot types are plain TypeScript interfaces with primitive fields. They carry no behavior.
- **Rule**: Snapshots MUST NOT be used to read or inspect domain object internals. If you need to know something about a domain object, ask it through a behavior method.

## 10. Repository Port Pattern

Repository interfaces define the contract for persisting and retrieving domain objects.

- **Rule**: Repository interfaces MUST be defined in the application layer.
- **Rule**: All repository methods MUST return `Promise<Result<T>>` to unify error handling across sync/async boundaries.
- **Rule**: Repository methods accept and return **domain objects**, not snapshots. Snapshot conversion is an internal adapter concern.
- **Rule**: Adapter implementations use domain behavior methods (e.g., `entity.isEqual(other)`) instead of comparing raw IDs or fields.
- **Rule**: In-memory repository adapters MUST store snapshots internally, not domain objects. To evaluate queries, they MUST hydrate the entire collection and filter the hydrated domain objects using domain behavior methods. This enforces the serialization boundary and ensures test doubles perfectly mirror production database constraints.

## 11. Command-Query Separation (CQS)

Every method should either be a command that performs an action, or a query that returns data to the caller, but not both.

- **Rule**: Commands (methods with side-effects that modify observable state) MUST NOT return any domain data. If they can fail, they return `Result<void>`.
- **Rule**: Queries (methods that return data) MUST NOT modify the observable state of the system.
