# Feature 029: Jest to Vitest Migration

## Status

🟡 Draft

## Overview

This specification defines the repository-level migration of Hemera's non-E2E
automated test stack from Jest and ts-jest to Vitest while keeping Playwright
as the dedicated end-to-end test solution.

The feature exists to reduce fragmentation in the automated test toolchain,
preserve confidence across existing non-E2E coverage scopes, and give the
repository a clearer long-term testing baseline without changing product
behavior.

## Current Reality

Hemera currently uses Jest-driven scripts and configuration for non-E2E test
execution.

- The main package scripts for automated tests point to Jest for default,
  unit, contract, integration, watch, and unit coverage execution.
- The repository maintains separate Jest configuration entry points for the
  default suite, contract suite, and integration suite.
- Many existing tests import execution helpers from @jest/globals.
- Many existing tests rely on Jest-specific mocking patterns, including
  jest.mock, jest.fn, and jest.spyOn.
- The existing test setup includes shared setup hooks, environment loading,
  DOM matcher registration, and database lifecycle handling that must continue
  to work after migration.

## Goals

- Migrate repository-managed non-E2E automated tests from Jest and ts-jest to
  Vitest.
- Preserve existing test confidence across unit, contract, and integration
  scopes.
- Keep Playwright as the only E2E framework and avoid mixing E2E concerns into
  the non-E2E migration.
- Maintain contributor and CI workflows through stable repository entry points
  for automated testing.
- Reduce migration risk by defining acceptance around behavioral parity,
  coverage continuity, and execution-path continuity rather than around a
  specific implementation strategy.

## Non-Goals

- Rewriting or replacing Playwright-based E2E coverage.
- Changing product features, business logic, UI behavior, or API behavior that
  is unrelated to the test runner migration.
- Expanding test scope beyond the repository's current non-E2E automated test
  baseline solely because of the migration.
- Requiring a broad rewrite of existing test intent, assertions, or domain
  scenarios unless needed to preserve equivalent execution under the new test
  runner.
- Defining low-level migration mechanics, exact config syntax, or file-by-file
  refactor steps in this specification.

## User Scenarios & Testing

### Primary User Story

As a maintainer, I want Hemera's non-E2E automated tests to move to a new
repository testing baseline without losing coverage scope, workflow clarity, or
CI confidence.

### Acceptance Scenarios

1. Given the repository's current non-E2E automated test inventory, when the
  migration is complete, then unit, contract, and integration validation can
  still be run as distinct repository-managed scopes.
2. Given a contributor who relies on repository test commands, when they run
  non-E2E validation after the migration, then they can still access clear
  entry points for default, unit, contract, and integration test flows.
3. Given non-E2E tests that rely on shared setup behavior, aliases, and
  mocking support, when those suites run after migration, then the suites keep
  their required setup and support behavior without silent coverage loss.
4. Given repository CI validation, when non-E2E automated checks run after the
  migration, then they continue to validate the intended non-E2E scope while
  Playwright remains the separate E2E path.

### Edge Cases

- What happens when a migrated non-E2E suite depends on shared database setup,
  teardown, or runtime polyfills?
- How does the repository preserve confidence for tests that currently depend
  on Jest-specific mocking and spy behavior?
- How does the migration avoid breaking repository alias resolution or ESM-
  oriented imports used by existing tests?

## User Stories

1. As a maintainer, I want the repository to use a single modern framework for
   non-E2E automated tests so that the test stack is easier to maintain.
2. As a contributor, I want existing unit, contract, and integration test entry
   points to remain recognizable so that daily development workflows are not
   disrupted.
3. As a release owner, I want CI validation for non-E2E tests to remain
   reliable after the migration so that test-runner changes do not reduce
   release confidence.
4. As a reviewer, I want mocking, setup behavior, aliases, and coverage output
   expectations to remain functionally equivalent so that the migration does
   not silently weaken validation.

## Requirements

### Functional Requirements

#### FR-1: Non-E2E Test Runner Migration Scope
- The repository MUST migrate its non-E2E automated test execution from Jest
  and ts-jest to Vitest.
- The migration MUST cover the repository's default, unit, contract, and
  integration automated test flows.
- The migration MUST leave Playwright as the repository's E2E test solution.

#### FR-2: Scope Parity Across Test Layers
- The migrated test setup MUST preserve distinct unit, contract, and
  integration coverage scopes.
- Contributors MUST continue to have clear repository entry points for running
  each non-E2E test scope independently.
- The migration MUST not collapse separate test scopes into a single opaque
  execution path that obscures which validation layer is being run.

#### FR-3: Shared Setup Continuity
- Shared automated-test setup behavior MUST remain available to migrated
  non-E2E tests.
- This continuity MUST include environment initialization, matcher setup,
  required runtime polyfills, and lifecycle hooks needed by the existing
  non-E2E suites.
- The migration MUST preserve the repository's ability to run non-E2E tests in
  environments that depend on shared database setup or teardown behavior.

#### FR-4: Module Resolution and Import Compatibility
- Migrated non-E2E tests MUST continue to resolve repository path aliases that
  are required by the current test suites.
- The migration MUST preserve compatibility for the repository's existing ESM-
  oriented import patterns used by non-E2E tests and their target modules.
- Contributors MUST not need ad hoc per-test workarounds to use standard
  repository imports after the migration.

#### FR-5: Mocking and Test Utility Compatibility
- The migration MUST provide an approved path for replacing or adapting
  existing Jest-specific test utility usage in the non-E2E suites.
- Existing test behavior that depends on module mocking, function spies,
  function stubs, and mock reset behavior MUST remain supportable after the
  migration.
- The migrated state MUST define one consistent mocking approach for non-E2E
  suites so contributors are not forced to mix incompatible mocking models.

#### FR-6: Coverage Continuity
- The migration MUST preserve the repository's ability to produce coverage
  outputs for non-E2E automated tests.
- Coverage reporting MUST continue to support the repository's established
  coverage-consumer workflows, including human-readable and machine-consumable
  outputs.
- Coverage scope for the default non-E2E baseline MUST remain aligned with the
  repository's current intent for measured areas unless an explicit follow-up
  feature changes that scope.

#### FR-7: Workflow and CI Continuity
- Repository-level commands for non-E2E automated tests MUST remain available
  after migration.
- CI entry points that currently validate non-E2E automated tests MUST continue
  to work after migration without reducing the validated scope.
- The migration MUST preserve a clear separation between non-E2E validation and
  Playwright-based E2E validation in local and CI workflows.

#### FR-8: Migration Completion Definition
- The migration MUST be considered complete only when the repository's
  non-E2E automated test flows run through Vitest-based entry points rather
  than Jest-based entry points.
- Repository documentation and feature artifacts related to non-E2E test
  execution MUST reflect the new test-runner baseline once the migration is
  complete.

### Non-Functional Requirements

- The specification MUST remain focused on goals, requirements, acceptance
  criteria, dependencies, assumptions, and non-goals rather than low-level
  implementation steps.
- The migrated testing workflow MUST preserve developer clarity about which
  suites are being run and what confidence each suite provides.
- The migration MUST minimize disruption to day-to-day contributor workflows by
  preserving familiar validation entry points wherever reasonable.
- The migrated state MUST support deterministic automated execution suitable
  for repository CI usage.

## Success Criteria

- All repository-maintained non-E2E automated test scopes that are currently
  in active use remain executable after the migration through repository-
  supported commands.
- Unit, contract, and integration validation remain independently runnable
  after the migration, with no intended scope removed from repository
  automation.
- Non-E2E automated validation continues to generate the coverage outputs
  needed by maintainers and automation consumers.
- The migration completes without expanding into Playwright E2E rewrites or
  unrelated product behavior changes.

## Acceptance Criteria

- [ ] A feature spec exists at specs/029-jest-to-vitest-migration/spec.md.
- [ ] The spec is written in English and follows the repository spec style.
- [ ] The spec states that non-E2E tests migrate from Jest and ts-jest to
  Vitest.
- [ ] The spec states that Playwright remains the E2E framework and is outside
  the migration scope.
- [ ] The spec captures the current Jest-based reality, including repository
  scripts, separate non-E2E config entry points, and Jest-specific helper or
  mocking usage patterns.
- [ ] The spec requires preservation of unit, contract, and integration test
  scopes.
- [ ] The spec requires preservation of shared setup hooks and environment
  setup behavior used by non-E2E suites.
- [ ] The spec requires repository alias compatibility for migrated non-E2E
  tests.
- [ ] The spec requires continuity of coverage outputs and CI entry points.
- [ ] The spec contains explicit non-goals for Playwright E2E rewrites and for
  unrelated product behavior.

## Dependencies

- Repository spec conventions in specs/STYLE.md.
- Existing non-E2E test inventory under tests/unit, tests/contracts, and
  tests/integration.
- Existing repository test setup behavior in tests/setup.ts.
- Existing repository command surface and coverage expectations defined through
  package.json and repository automation.
- Existing path-alias and module-resolution expectations used by repository
  source files and tests.

## Assumptions

- The repository will continue to need separate non-E2E validation layers for
  unit, contract, and integration confidence.
- Existing CI flows or related automation currently depend on the repository's
  published non-E2E test commands and coverage artifacts.
- Most migration work will focus on preserving current validation behavior
  rather than redefining what the tests are intended to prove.

## Open Questions

- Should the repository preserve the current command names exactly after the
  migration, or is limited command-surface cleanup acceptable if CI and
  contributor documentation are updated in the same feature?
- Should the migration preserve the current coverage artifact set exactly, or
  is an equivalent artifact set acceptable if downstream consumers continue to
  receive the information they need?