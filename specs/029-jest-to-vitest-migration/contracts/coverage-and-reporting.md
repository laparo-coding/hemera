# Contract: Coverage and Reporting

## Purpose

Define the minimum coverage and reporting continuity required when the repository moves from Jest to
Vitest for non-E2E tests.

## Invariants

### Coverage Contract 1: Equivalent Coverage Producer Role

- The repository must continue to produce coverage for the default non-E2E baseline after the
  migration.
- A change in runner is acceptable; a silent loss of coverage reporting is not.

### Coverage Contract 2: Required Output Formats

- Coverage reporting must continue to expose the following output formats or direct equivalents:
  - text
  - lcov
  - html
  - json-summary

### Coverage Contract 3: Coverage Scope Intent

- The default measured scope must stay aligned with the repository's current intent unless a later
  feature explicitly changes it.
- If the migration intentionally expands or tightens coverage scope, that change must be documented
  as part of implementation rather than introduced accidentally by config drift.

### Coverage Contract 4: Consumer Compatibility

- Human readers must still be able to inspect local coverage output.
- CI or helper scripts that consume non-E2E coverage artifacts must continue to receive usable
  inputs.

### Coverage Contract 5: Scope Validation Before Cleanup

- Coverage parity must be validated before Jest and ts-jest are removed from the repository.

## Acceptance Signals

- `npm run test:unit:coverage -- --no-file-parallelism`
- presence of coverage output in the expected repository location
- repository scripts or checks that consume coverage artifacts continue to operate