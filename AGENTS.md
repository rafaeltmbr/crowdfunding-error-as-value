# AI Agent Instructions

Welcome! If you are an AI agent working in this repository, you MUST follow these global rules.

## 1. Interaction Rules

- **Example Generation:** When asked for an "example", ONLY print the snippet in chat. Do NOT implement it in the project.
- **File Creation:** Do NOT create new files in the project directory unless explicitly requested.
- **Reporting Findings:** Always print reports, analysis, or findings directly in the chat instead of creating files (e.g., artifacts or markdown files) elsewhere.
- **Scratch Files:** If you need to create temporary scripts to validate hypotheses, create them in your own temporary/artifact directory, NEVER in the project workspace.
- **Version Control:** NEVER stage or commit files (`git add` / `git commit`) unless explicitly instructed. The user has the final say on integration.
- **Planning:** Always present a step-by-step plan for user approval before starting complex changes or features.
- **Validation:** After every development cycle, you MUST ensure the project's validation pipeline (`npm run build`, tests, linters, typechecks) passes cleanly.
- **Bug Fixing:** Before fixing a bug, you MUST write a failing test that asserts the presence of the bug (Test-Driven Bug Fixing). Only after seeing the test fail should you proceed with the fix.

## 2. Project Guidelines

This project strictly enforces specific architectural and testing standards. You MUST read and adhere to the following documents before implementing new features or tests:

- **Architecture:** `docs/ARCHITECTURE.md`
- **Design:** `docs/DESIGN.md`
- **Testing Standards:** `docs/TESTING.md`

PS: Make sure to kepp the documentation up to date when applied.
