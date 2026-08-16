## Feature 02 — Auto-Discovery & Composition Root

**Category:** Bootstrap
**Status:** ✅ Ready to implement
**Dependencies:** Feature 1
**New packages:** None (`node:fs`, `node:path`, `node:url` are built-in)

### Why

The console must automatically detect and load all Value Objects, Entities, Repository adapters, and Use Cases **without requiring manual updates** when new classes are added. This eliminates a maintenance burden that would otherwise grow with every new domain concept. The developer adds a new Use Case file, and the next time they launch the console, it is already available.

### Specification

The auto-discovery system scans predefined source directories at console launch, dynamically imports each module, and organizes the exports into namespaces. No reflection metadata, no DI framework — just filesystem scanning and naming conventions.

#### Step 1: Module Scanner

Create a utility function that scans a directory and dynamically imports all `.ts` files:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

async function scanModules(absoluteDir: string): Promise<Map<string, Record<string, unknown>>> {
  const entries = fs.readdirSync(absoluteDir)
  const tsFiles = entries.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  const modules = new Map<string, Record<string, unknown>>()

  for (const file of tsFiles) {
    const filePath = path.join(absoluteDir, file)
    const module = await import(pathToFileURL(filePath).href)
    modules.set(file.replace('.ts', ''), module as Record<string, unknown>)
  }

  return modules
}
```

Each entry in the returned `Map` is keyed by the filename (without extension) and contains the module's named exports.

Dynamic `import()` with `pathToFileURL()` ensures Node's ESM loader processes the `.ts` files through `tsx`'s registered hooks, which handles both TypeScript compilation and path alias resolution.

#### Step 2: Build Value Object & Entities Namespaces

For Value Objects and Entities, **flatten all named exports** from all files into a single namespace object:

```typescript
function flattenExports(modules: Map<string, Record<string, unknown>>): Record<string, unknown> {
  const namespace: Record<string, unknown> = {}

  for (const [, moduleExports] of modules) {
    for (const [exportName, exportValue] of Object.entries(moduleExports)) {
      namespace[exportName] = exportValue
    }
  }

  return namespace
}
```

This produces `Values.Name`, `Values.Email`, `Values.ExceptionGroup`, etc. — each key is the export's own name.

TypeScript-only exports (`type`, `interface`) are erased at compile time and never appear in the dynamic import result. Only runtime values (`class`, `enum`, `const`, `function`) survive.

#### Step 3: Auto-Instantiate Repository Adapters

All InMemory repository adapters have **zero-argument constructors**. The discovery system instantiates each one and derives a namespace key by stripping the `RepositoryInMemory` suffix:

```typescript
function instantiateRepos(modules: Map<string, Record<string, unknown>>): {
  instances: Record<string, unknown>
  registry: Record<string, unknown>
} {
  const instances: Record<string, unknown> = {}
  const registry: Record<string, unknown> = {}

  for (const [fileName, moduleExports] of modules) {
    // Find the class export matching the filename
    const RepoClass = moduleExports[fileName] as new () => unknown
    if (!RepoClass || typeof RepoClass !== 'function') continue

    const instance = new RepoClass()

    // Derive namespace key: "CampaignRepositoryInMemory" → "Campaign"
    const key = fileName.replace('RepositoryInMemory', '')
    instances[key] = instance

    // Build registry for Use Case auto-wiring (see Step 4):
    // "Campaign" → camelCase "campaignRepository" → instance
    const paramName = key.charAt(0).toLowerCase() + key.slice(1) + 'Repository'
    registry[paramName] = instance
  }

  return { instances, registry }
}
```

The `registry` maps camelCase parameter names (e.g., `campaignRepository`) to instances. This is used by Step 4 to match Use Case constructor parameters.

#### Step 4: Auto-Wire Use Cases

Use Cases accept Repository Port interfaces via their constructor. The auto-wiring system **parses the constructor source code** to extract parameter names and matches them against the repository registry from Step 3.

**Constructor parameter parsing:**

When `tsx` (which uses `esbuild` internally) compiles TypeScript to JavaScript, it strips type annotations and the `private` keyword but **preserves parameter names** (esbuild does not minify or rename identifiers when running without bundling). A class like:

```typescript
export class MakeDonationUseCase {
  constructor(
    private campaignRepository: CampaignRepository,
    private supporterRepository: SupporterRepository
  ) {}
}
```

Is compiled to something like:

```javascript
class MakeDonationUseCase {
  constructor(campaignRepository, supporterRepository) {
    this.campaignRepository = campaignRepository
    this.supporterRepository = supporterRepository
  }
}
```

Calling `MakeDonationUseCase.toString()` returns this source, and the parameter names can be extracted with a regex:

```typescript
function getConstructorParams(cls: new (...args: unknown[]) => unknown): string[] {
  const source = cls.toString()
  const match = source.match(/constructor\s*\(([^)]*)\)/)
  if (!match?.[1]) return []
  return match[1]
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}
```

**Wiring:**

```typescript
function wireUseCases(
  modules: Map<string, Record<string, unknown>>,
  repoRegistry: Record<string, unknown>
): Record<string, unknown> {
  const instances: Record<string, unknown> = {}

  for (const [fileName, moduleExports] of modules) {
    // Find the class export matching the filename
    const UseCaseClass = moduleExports[fileName] as new (...args: unknown[]) => unknown
    if (!UseCaseClass || typeof UseCaseClass !== 'function') continue

    // Parse constructor to find required repositories
    const paramNames = getConstructorParams(UseCaseClass)
    const args = paramNames.map((name) => {
      const dep = repoRegistry[name]
      if (!dep) {
        console.warn(`⚠ UseCase "${fileName}": no repository found for param "${name}"`)
      }
      return dep
    })

    const instance = new UseCaseClass(...args)

    // Derive namespace key: "CreateCampaignUseCase" → "CreateCampaign"
    const key = fileName.replace('UseCase', '')
    instances[key] = instance
  }

  return instances
}
```

#### Step 5: Assemble and Attach to REPL Context

```typescript
const srcRoot = path.resolve(/* derive from import.meta.url to src/ */)

const voModules = await scanModules(path.join(srcRoot, 'domain/values'))
const entityModules = await scanModules(path.join(srcRoot, 'domain/entities'))
const repoModules = await scanModules(path.join(srcRoot, 'infra/repositories'))
const useCaseModules = await scanModules(path.join(srcRoot, 'app/use_cases'))

const Values = flattenExports(voModules)
const Entities = flattenExports(entityModules)
const { instances: Repositories, registry: repoRegistry } = instantiateRepos(repoModules)
const UseCases = wireUseCases(useCaseModules, repoRegistry)

// After replServer is created:
replServer.context.Values = Values
replServer.context.Entities = Entities
replServer.context.Repositories = Repositories
replServer.context.UseCases = UseCases
```

#### Edge Cases & Error Handling

- **File without a matching export:** If a `.ts` file does not export a class/const matching its filename, the discovery silently skips it. Example: a `helpers.ts` utility file would be scanned but produce no namespace entry since `moduleExports['helpers']` would be `undefined`.
- **Missing repository dependency:** If a Use Case constructor references a repository parameter name that does not match any instantiated adapter, a warning is printed to the console. The Use Case is still instantiated (with `undefined` for that param), and it will fail at runtime when invoked — which is the expected behavior rather than crashing the entire console.
- **Name collisions in flattened namespaces:** If two Value Object files export the same name, the later file's export overwrites the earlier one. In practice this does not happen because each file exports uniquely named classes. If it ever does, the developer will notice because one export disappears.

### Notes

- This system requires **zero manual changes** when a new Value Object, Entities, Repository, or Use Case is added — as long as the new file follows the project's existing naming conventions.
- The constructor parameter parsing relies on `tsx`/`esbuild` preserving parameter names. This is guaranteed when running without bundling/minification, which is always the case for `tsx` (it's a runtime loader, not a bundler).
- When the project introduces hand-written factories for Use Cases or Repositories, the auto-wiring logic in Steps 3-4 should delegate to those factories instead of instantiating directly.

### Testing

- **Unit Testable:** Yes. `scanModules`, `flattenExports`, `instantiateRepos`, and `wireUseCases` can be unit tested by mocking `node:fs` or pointing them to a dummy `fixtures` directory.
