## Feature 13 — `.env` Loading

**Category:** Bootstrap
**Status:** 🔜 Not needed yet — implement when infrastructure adapters require configuration
**Dependencies:** Feature 1

### Why

Currently, there are no environment-dependent configuration values in the project. All infrastructure is in-memory. However, the moment a real database adapter, external API integration, or any other infrastructure adapter requiring configuration is introduced, the console must load environment variables before instantiating adapters.

### Specification

**Option A — Node's built-in `--env-file` flag (Node >= 20.6.0):**

```json
"console": "node --env-file=.env --import tsx src/infra/console/index.ts"
```

Loads `.env` before any module code runs. No additional dependencies.

**Option B — `dotenv` package:**

```typescript
import 'dotenv/config'
```

Requires adding `dotenv` as a devDependency.

**Recommended:** Option A. It requires no extra dependency and is the Node standard.

### Notes

- Add `.env` to `.gitignore` to prevent secrets from being committed.
- **Do not implement until the first infrastructure adapter that requires environment configuration is added.**

### Testing

- **Integration Testable:** Yes. Can be tested by executing the console process with a dummy `.env` file and asserting that `process.env` correctly contains the injected values during the bootstrap phase.
