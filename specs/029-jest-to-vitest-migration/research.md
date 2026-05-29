# Research: Jest to Vitest Migration (Spec 029)

**Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

## Research 1: Preserve the Existing Non-E2E Command Surface

**Decision**: Keep the current repository-facing script names for non-E2E test flows and replace
their internals with Vitest.

**Rationale**:
- `package.json` currently exposes familiar entry points for `test`, `test:unit`,
  `test:unit:coverage`, `test:contracts`, `test:integration`, and `test:watch`.
- Keeping those entry points stable reduces workflow churn for contributors and CI.
- The spec values workflow continuity more than CLI cleanup.

**Alternatives considered**:
- Rename all scripts to `vitest:*`: rejected because it creates avoidable workflow and CI churn.
- Keep both Jest and Vitest command families long term: rejected because it prolongs toolchain
  fragmentation.

## Research 2: Replace the Three Jest Configs with Explicit Vitest Projects

**Decision**: Use one Vitest configuration surface with explicit `unit`, `contracts`, and
`integration` projects instead of one undifferentiated suite.

**Rationale**:
- The current repository already models three distinct non-E2E scopes with three Jest configs.
- Separate projects preserve clarity around runtime environment, timeouts, include patterns,
  ignored paths, and database-related execution constraints.
- This directly satisfies the spec requirement that scopes remain independently runnable and not be
  collapsed into an opaque path.

**Alternatives considered**:
- One Vitest config with path filters only: rejected because it weakens scope clarity and makes
  per-scope behavior easier to drift.
- Separate standalone Vitest config files per scope: rejected because it preserves duplication that
  the migration can simplify.

## Research 3: Treat Jest API Usage as a First-Class Compatibility Migration

**Decision**: Plan an explicit compatibility slice that converts `@jest/globals` imports,
`jest.mock`, `jest.fn`, `jest.spyOn`, `jest.Mocked*`, and related utilities to the Vitest `vi`
model.

**Rationale**:
- The current test inventory contains extensive Jest-specific API usage across unit, contract, and
  integration tests.
- Deferring this conversion until later slices would make every failing test harder to diagnose.
- A single approved mocking model is required by the spec.

**Alternatives considered**:
- Rely on compatibility shims indefinitely: rejected because it leaves the repository in a partial
  migration state.
- Hand-edit files opportunistically during each suite migration: rejected because it produces
  duplicated churn and slower debugging.

## Research 4: Reuse the Shared Setup Spine Instead of Forking It

**Decision**: Keep `tests/setup.ts` as the shared setup file and adapt it for Vitest lifecycle APIs.

**Rationale**:
- `tests/setup.ts` currently handles env loading, polyfills, jsdom detection, database lifecycle,
  Prisma migrations, seed fallback, and analytics cleanup.
- Splitting that logic per suite would increase drift risk exactly where the migration needs
  stability.
- Reusing the setup spine makes parity easier to validate across unit, contract, and integration
  scopes.

**Alternatives considered**:
- Create separate setup files per suite immediately: rejected because it expands scope before parity
  is proven.
- Inline setup into individual tests: rejected because it is unmaintainable and conflicts with the
  spec's continuity goals.

## Research 5: Preserve Environment-Specific Test Behavior Explicitly

**Decision**: Convert existing per-file jsdom directives to the Vitest environment marker and keep
Node as the default environment for non-DOM suites.

**Rationale**:
- The repository contains many component tests that rely on jsdom and Testing Library.
- The shared setup file explicitly branches between jsdom and database-aware Node behavior.
- Losing that distinction would either break UI tests or accidentally boot database setup for jsdom
  files.

**Alternatives considered**:
- Set jsdom globally for all unit tests: rejected because many service and database-oriented tests
  are better suited to Node and would gain unnecessary browser shims.
- Set Node globally without per-file overrides: rejected because component tests already rely on
  jsdom behavior.

## Research 6: Preserve Coverage Consumer Value, Not Jest Internals

**Decision**: Require equivalent coverage outputs for human and machine consumers, specifically
`text`, `lcov`, `html`, and `json-summary` artifacts.

**Rationale**:
- The current default Jest config uses V8 coverage and produces these formats.
- Coverage continuity matters to maintainers and automation, but byte-for-byte parity is not a
  useful acceptance standard.
- Vitest can satisfy the repository need if these consumer-facing outputs remain available.

**Alternatives considered**:
- Accept only Vitest defaults without parity checks: rejected because it risks silent downstream
  breakage.
- Require exact artifact identity with Jest: rejected because it is stricter than the business need.

## Research 7: Keep Playwright Out of Scope and Unchanged

**Decision**: Leave Playwright scripts, configuration, and E2E validation untouched by this feature.

**Rationale**:
- The spec explicitly defines Playwright as the dedicated E2E framework and excludes E2E rewrites.
- Isolating the migration to non-E2E scopes reduces rollback cost and debugging ambiguity.

**Alternatives considered**:
- Unify all tests under a new runner strategy including E2E: rejected because it violates scope and
  increases risk sharply.

## Research 8: Use Slice-by-Slice Migration Rather Than a Big-Bang Swap

**Decision**: Implement the migration in ordered slices: infrastructure, compatibility, unit,
contracts, integration, cleanup.

**Rationale**:
- Current risk is concentrated in compatibility and environment behavior rather than in a single
  config file.
- Slice-by-slice migration creates narrower validation checkpoints and cheaper rollback paths.
- Unit tests provide the fastest signal, so they should migrate before contract and integration
  suites.

**Alternatives considered**:
- Replace all Jest scripts and configs in one commit: rejected because it would hide the real source
  of failures.
- Migrate integration first: rejected because it is the slowest and most environment-sensitive
  scope.

## Open Questions Resolved for Planning

- **Should command names be preserved?** Yes. Preserve current non-E2E script names and swap the
  underlying runner.
- **Must coverage artifacts remain exactly identical?** No. Equivalent artifact value is required,
  not Jest-internal identity.

## Implementation Implications

1. The migration backlog should begin with infrastructure and compatibility, not by editing random
   failing specs.
2. Task generation should track Node and jsdom paths separately inside the unit slice.
3. CI and local validation should compare old and new non-E2E flows by scope before cleanup removes
   Jest.