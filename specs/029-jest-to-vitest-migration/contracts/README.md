# Contracts: Jest to Vitest Migration (Spec 029)

This feature does not add product-facing HTTP or GraphQL endpoints. The contracts in this directory
therefore define repository workflow and validation invariants for the non-E2E test runner
migration.

## Contract Set

- `non-e2e-test-workflows.md`: required behavior for repository-managed unit, contract, and
  integration commands after the migration
- `coverage-and-reporting.md`: required coverage outputs and parity rules for human and CI consumers

## Contract Intent

These contracts make the migration testable without inventing a new product API surface. They are
the source for implementation tasks that preserve:

- scope separation
- shared setup continuity
- alias and environment compatibility
- coverage artifact continuity
- unchanged Playwright E2E separation