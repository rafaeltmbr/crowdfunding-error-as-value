# Crowdfunding — Error as Value

A crowdfunding domain model built with TypeScript, following **Clean Architecture** and the **Error as Value** pattern (Result monad). Errors are returned explicitly instead of thrown, making failure handling a first-class concern.

## File Structure

```
src/
├── domain/          # Entities and Value Objects (no external dependencies)
│   ├── entities/    # Campaign, Donation, Supporter, Tier
│   └── values/      # Email, Id, Money, Name, Result
└── app/             # Application layer (repositories, services)
```

The domain layer has zero dependencies on the application or infrastructure layers. This is enforced by ESLint rules.

## Prerequisites

- Node.js (LTS)
- npm

## Getting Started

```bash
npm install
```

## Scripts

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Start development server with hot reload                   |
| `npm run test`         | Run tests in watch mode                                    |
| `npm run test:run`     | Run tests once with coverage report                        |
| `npm run lint`         | Lint source files                                          |
| `npm run typecheck`    | Type-check the entire project (including tests)            |
| `npm run format`       | Format all files with Prettier                             |
| `npm run format:check` | Check formatting without modifying files                   |
| `npm run build`        | Full production build (audit, format, lint, test, compile) |

## Documentation

- [Testing Guidelines](docs/TESTING_GUIDELINES.md) — Standards for writing and verifying domain tests.
