# Contract: Non-E2E Test Workflows

## Purpose

Define the required repository workflow behavior after migrating non-E2E tests from Jest to Vitest.

## Invariants

### Workflow Contract 1: Default Non-E2E Entry Point

- The repository must provide a `test` command that executes the default non-E2E baseline through
  Vitest rather than Jest.
- The default baseline must remain understandable to contributors and must not implicitly run
  Playwright.

### Workflow Contract 2: Independently Runnable Scopes

- The repository must provide distinct commands for:
  - unit tests
  - unit coverage
  - contract tests
  - integration tests
- Each command must target the intended scope explicitly rather than rely on undocumented path
  filtering.

### Workflow Contract 3: Shared Setup Continuity

- All migrated non-E2E scopes must continue to load the shared setup behavior currently hosted in
  `tests/setup.ts` or an intentional successor with equivalent behavior.
- This includes env loading, DOM matcher registration, required polyfills, database lifecycle
  setup, and best-effort cleanup routines.

### Workflow Contract 4: Alias and Module Resolution

- Migrated tests must continue to resolve `@/` imports and existing ESM-oriented imports without
  per-test workarounds.

### Workflow Contract 5: Environment Compatibility

- Node-oriented tests must keep a Node environment by default.
- jsdom-oriented test files must retain a file-level mechanism to request jsdom behavior.

### Workflow Contract 6: Mocking Consistency

- The repository must adopt one approved mocking model for migrated non-E2E suites.
- Broad Jest API usage must be replaced consistently enough that contributors do not mix two mock
  systems in the steady state.

### Workflow Contract 7: Playwright Separation

- Playwright scripts and projects remain outside the migration scope and must continue to represent
  the repository's E2E layer only.

## Acceptance Signals

- `npm run test`
- `npm run test:unit`
- `npm run test:unit:coverage`
- `npm run test:contracts`
- `npm run test:integration`
- unchanged Playwright command still succeeds independently