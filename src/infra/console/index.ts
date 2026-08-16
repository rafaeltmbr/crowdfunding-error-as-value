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
