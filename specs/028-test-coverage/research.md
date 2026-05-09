# Research: Test Coverage (Spec 028)

**Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)

## Research 1: Current Test and Coverage Baseline

**Finding**: The repository already has a mature multi-layer testing setup, but the
coverage program is still centered mainly on Jest coverage for `lib/**/*.ts`.

**Evidence**:
- `package.json` exposes separate commands for unit, contract, and E2E execution.
- `jest.config.ts` collects coverage from `lib/**/*.ts` only.
- `playwright.config.ts` is configured for multiple browser/auth projects, but
  not for coverage reporting.

**Implication**:
- Feature 028 should not start from zero.
- The main opportunity is not introducing testing as a new capability, but
  increasing useful coverage in a deliberate way across the highest-value areas.

## Research 2: Existing Coverage Thresholds Already Exist

**Finding**: The repo already enforces non-trivial Jest coverage thresholds.

**Evidence**:
- Global Jest threshold: 70% for branches, functions, lines, and statements.
- `./lib/services/` threshold: 85%.
- Lower per-path overrides exist for `./lib/monitoring/` and `./lib/stripe/`.

**Implication**:
- Feature 028 should not redefine coverage from scratch without justification.
- “Increase coverage significantly” should likely mean improving actual covered
  behavior and selectively expanding what is measured, not only raising numeric
  thresholds blindly.

**Open decision**:
- Whether Feature 028 should raise thresholds, expand `collectCoverageFrom`, or
  do both remains undecided.

## Research 3: The Current Measurement Scope Is Narrower Than Product Scope

**Finding**: Coverage reporting currently focuses on core library logic and does
not directly measure large parts of `app/`, `components/`, or other runtime
surfaces.

**Evidence**:
- `jest.config.ts` uses `collectCoverageFrom: ['lib/**/*.ts']`.
- The repo contains substantial logic in `app/`, `components/`, `lib/`, and API
  handlers, but only the `lib` tree is part of the formal coverage report.

**Implication**:
- A meaningful coverage increase may require expanding the measured scope, not
  just adding tests in already-covered files.
- This needs to be handled carefully to avoid tanking signal quality with large
  amounts of low-value or hard-to-test UI coverage.

**Best-practice note**:
- Prefer measuring behavior-rich modules, server logic, and reusable client
  logic before broad, presentation-only component trees.

## Research 4: Unit and Component Testing Are Operational

**Finding**: Jest + Testing Library support is already in place and working.

**Evidence**:
- `@testing-library/react`, `@testing-library/jest-dom`, and
  `jest-environment-jsdom` are installed.
- `jest.config.ts` supports both `.spec.ts` and `.spec.tsx` under `tests/unit/`.
- Feature 022 research already documented working component-test coverage for
  several course-detail components.

**Implication**:
- Feature 028 does not need foundational component-test setup.
- The more useful question is which missing components or flows deserve tests,
  not whether the tooling can support them.

## Research 5: E2E Infrastructure Is Capable but Expensive

**Finding**: Playwright setup is fairly complete, including authenticated,
unauthenticated, and production-smoke projects, but E2E remains the most costly
layer for additional coverage.

**Evidence**:
- `playwright.config.ts` includes `chromium-auth`, `chromium-no-auth`,
  `chromium`, and `production-smoke` projects.
- Retries, traces, videos, screenshots, and a web-server bootstrap are already
  configured.

**Implication**:
- Feature 028 should treat E2E as a critical-path confidence layer, not the
  default way to increase every missing coverage area.
- The best balance of quality and effort will likely come from a mix of unit,
  contract, and a smaller number of high-value E2E additions.

## Research 6: Prior Feature 022 Should Be Treated as Historical Input, Not a Replacement

**Finding**: Feature 022 already explored broader test-coverage topics,
including Stripe, invoice flows, production smoke tests, CI stability, and
component testing.

**Evidence**:
- `specs/022-test-coverage/spec.md`
- `specs/022-test-coverage/research.md`

**Implication**:
- Feature 028 should not duplicate 022 mechanically.
- It should either refine unresolved areas from 022, narrow scope to the most
  valuable quality gaps, or define a new coverage strategy based on current repo
  reality.

**Recommended framing**:
- Use 022 as historical context.
- Use 028 to define the next practical, measurable coverage increment.

## Research 7: Best-Practice Balance Means Quality Over Vanity Metrics

**Finding**: The user's direction for 028 emphasizes a significant coverage
increase while preserving a good balance of quality and best-practice testing.

**Interpretation**:
- Coverage should increase where it improves confidence in business-critical or
  regression-prone behavior.
- Feature 028 should explicitly reject low-value tests created only to push a
  percentage upward.

**Best-practice principles for planning**:
- Prioritize business logic, server actions, API handlers, shared utilities, and
  regression-prone UX behavior.
- Prefer stable, deterministic tests over brittle snapshot-heavy or CSS-only
  assertions.
- Use E2E for cross-system confidence, not for every branch condition.
- Keep test runtime and maintenance cost proportional to the value gained.

## Recommendations

1. Define the measurable meaning of “significant increase” before planning.
   Candidate dimensions: global Jest coverage, critical-path coverage, or named
   domain coverage.
2. Audit the current low-coverage, high-risk surfaces before setting targets.
   Good candidates are server logic, API routes, booking/payment flows, and
   dashboard-related behavior.
3. Decide whether Spec 028 will expand `collectCoverageFrom` beyond `lib/**/*.ts`.
   That decision has a large effect on both reported numbers and implementation
   scope.
4. Prefer a layered strategy:
   - unit tests for deterministic business logic
   - contract/integration tests for API behavior
   - targeted E2E for end-to-end regressions
5. Reuse Feature 022 findings where still valid, but avoid carrying forward
   outdated assumptions without revalidation.

## Open Questions

- Which exact modules or flows are considered the highest-value targets for the
  next coverage increase?
- Should Feature 028 keep the current threshold model and expand scope, or keep
  scope and raise thresholds?
- Should `app/` and `components/` enter formal coverage reporting, and if so,
  which subsets first?
- Is the primary goal regression prevention, CI confidence, release confidence,
  or numeric coverage improvement?
- What runtime budget is acceptable for additional tests in CI?
