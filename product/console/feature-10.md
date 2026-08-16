## Feature 10 — TypeScript-Aware REPL

**Category:** Bootstrap
**Status:** ⚠️ Needs investigation
**Dependencies:** Feature 1

### Why

The standard Node REPL evaluates JavaScript, not TypeScript. While `tsx` compiles the console entry script and all its imports, the interactive prompt itself does not understand TypeScript syntax. If the developer types `const name: Name = Values.Name.make('test')`, it fails with a syntax error.

This is a quality-of-life improvement, not a blocker — developers can omit type annotations when typing in the prompt.

### Specification

**Option A — Node's `--experimental-strip-types` flag (Node >= 22.6.0):**

Change the NPM script to:

```json
"console": "node --experimental-strip-types --import tsx src/infra/console/index.ts"
```

This tells the Node engine to strip TypeScript type annotations. The `--import tsx` flag handles initial module compilation and path alias resolution.

**Requires verification:** Check whether `--experimental-strip-types` applies to the interactive REPL eval loop (not just the script loading phase). This behavior may vary across Node versions.

**Option B — Custom `eval` function:**

Pass a custom `eval` to `repl.start()` that strips type annotations before evaluation. This would require either `esbuild` (bundled inside `tsx`) or a lightweight regex-based stripper.

**Trade-off:** Adds complexity around `vm.runInContext`, ESM evaluation, and multiline input handling (see Feature 12).

### Notes

- **Recommendation:** Start without this feature. JavaScript in the prompt is usable for interactive sessions. Revisit once the project's minimum Node version supports stable type stripping in the REPL.
- No new dependencies are needed for Option A.

### Testing

- **Integration Testable:** Yes. If using the `--experimental-strip-types` flag, this can be verified by spawning the console process and passing a TypeScript statement to `stdin` and ensuring it evaluates without a syntax error.
