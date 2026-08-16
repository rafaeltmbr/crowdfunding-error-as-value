import { Console } from '@infra/console/Console'

try {
  const consoleApp = new Console()
  await consoleApp.start()
} catch (err) {
  console.error('Failed to start console:', err)
  process.exit(1)
}
