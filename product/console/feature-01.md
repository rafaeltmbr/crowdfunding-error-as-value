## Feature 01 — Console Entry Script & NPM Script

**Category:** Bootstrap
**Status:** ✅ Ready to implement
**Dependencies:** None

### Why

Without a script to launch, nothing else in this document matters. This is the skeleton that all other features are added to.

### Specification

Create the file `src/infra/console/index.ts` with the following structure:

```typescript
import * as repl from 'node:repl'

async function bootstrap(): Promise<void> {
  // 1. (Future) Load environment variables — see Feature 14
  // 2. Auto-discover and wire modules — see Feature 2
  // 3. Print welcome banner — see Feature 7
  // 4. Start the REPL
  const replServer = repl.start({
    prompt: 'crowdfunding > ',
    useColors: true,
    // writer: customWriter — see Feature 4 & 5
  })
  // 5. Attach namespaces to replServer.context — see Feature 2
  // 6. Attach helpers (seed, clear) — see Feature 8 & 9
  // 7. Setup persistent history — see Feature 6
  // 8. Register dot-commands — see Feature 10
  // 9. Handle graceful shutdown
  replServer.on('exit', () => {
    console.log('Goodbye.')
    process.exit(0)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start console:', err)
  process.exit(1)
})
```

Add an NPM script to `package.json`:

```json
"console": "tsx src/infra/console/index.ts"
```

The developer launches the console with:

```bash
npm run console
```

### Notes

- `tsx` handles both TypeScript compilation and path alias resolution (it reads `tsconfig.json`).
- The `bootstrap()` function is `async` to support future async initialization (e.g., database connections when real adapters are introduced).
- The `exit` handler is where future teardown logic goes (closing connections, flushing data).

### Testing

- **Integration Testable:** Yes. The entry script can be tested by spawning it as a child process and asserting that it boots cleanly without throwing errors, or by importing the `bootstrap` function and mocking `repl.start` to ensure all setup steps are executed.
