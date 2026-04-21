# Tasks: Test Coverage

**Input**: Design documents from `specs/028-test-coverage/`
**Prerequisites**: `specs/028-test-coverage/plan.md`, `specs/028-test-coverage/research.md`, `specs/028-test-coverage/data-model.md`, `specs/028-test-coverage/contracts/coverage-gates.md`, `specs/028-test-coverage/quickstart.md`

## Execution Flow (main)

```
1. Capture the current coverage baseline and critical-area candidates
2. Write failing tests for coverage contracts and high-value slices
3. Add typed coverage planning artifacts that describe baselines, areas, targets, workstreams, and gates
4. Make backend, API, component, and journey tests pass with minimal production refactors
5. Expand measured coverage scope and wire CI enforcement
6. Update docs and run the full validation sequence
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Every task below includes exact repository paths

## Phase 3.1: Setup

- [x] T001 Capture the current baseline outputs from `npm run typecheck`, `npm run lint`, `npm test -- --coverage --runInBand`, `npm run test:contracts -- --runInBand`, and `npm run test:e2e -- --project=chromium-auth`, then document the results and initial critical-area shortlist in `docs/tests/test-coverage-baseline.md`
- [x] T002 Add coverage helper scaffolding in `scripts/coverage/report-summary.mjs` and `scripts/coverage/assert-gates.mjs`, then wire `test:unit:coverage`, `coverage:summary`, and `coverage:check` scripts in `package.json`
- [x] T003 Create the shared typed coverage catalog entry point in `tests/coverage/index.ts` so later model and gate tasks have a stable import surface

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation tasks in Phase 3.3**

- [x] T004 [P] Add the contract test for `specs/028-test-coverage/contracts/coverage-gates.md` in `tests/contracts/coverage-gates.spec.ts`
- [x] T005 [P] Add the maintainer baseline workflow integration test in `tests/integration/coverage-baseline.spec.ts`
- [x] T006 [P] Add the contributor critical-area workflow integration test in `tests/integration/coverage-workflow.spec.ts`
- [x] T007 [P] Add failing backend critical-area unit tests for `lib/services/booking.ts` in `tests/unit/lib/services/booking.spec.ts`
- [x] T008 [P] Add failing backend critical-area unit tests for `lib/services/prerequisite.ts` in `tests/unit/lib/services/prerequisite.spec.ts`
- [x] T009 [P] Extend contract coverage around `app/api/bookings/route.ts`, `app/api/bookings/[bookingId]/invoice/route.ts`, and `app/api/admin/bookings/pending/route.ts` in `tests/contracts/bookings-api.spec.ts` and `tests/contracts/admin-booking-pending.spec.ts`
- [x] T010 [P] Add failing dashboard component tests for `components/dashboard/UserPageContainer.tsx` and `components/dashboard/UserBreadcrumb.tsx` in `tests/unit/components/UserPageContainer.spec.tsx` and `tests/unit/components/UserBreadcrumb.spec.tsx`
- [x] T011 [P] Extend authenticated dashboard journey coverage in `tests/e2e/dashboard.spec.ts` and `tests/e2e/dashboard-sections.spec.ts` for `app/dashboard/page.tsx`, `app/my-courses/page.tsx`, and `app/user-profile/[[...user-profile]]/page.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T012 [P] Implement the `CoverageBaseline` model in `tests/coverage/coverage-baseline.ts`
- [x] T013 [P] Implement the `CriticalArea` model in `tests/coverage/critical-areas.ts`
- [x] T014 [P] Implement the `CoverageTarget` model in `tests/coverage/coverage-targets.ts`
- [x] T015 [P] Implement the `TestWorkstream` model in `tests/coverage/test-workstreams.ts`
- [x] T016 [P] Implement the `QualityGateDefinition` model in `tests/coverage/quality-gates.ts`
- [x] T017 Make T004-T006 pass by implementing baseline parsing, report rendering, and gate assertion logic in `scripts/coverage/report-summary.mjs`, `scripts/coverage/assert-gates.mjs`, `tests/contracts/coverage-gates.spec.ts`, `tests/integration/coverage-baseline.spec.ts`, `tests/integration/coverage-workflow.spec.ts`, and `docs/tests/test-coverage-baseline.md`
- [x] T018 Make T007-T008 pass by broadening deterministic backend coverage for `lib/services/booking.ts` and `lib/services/prerequisite.ts`, adding only the minimum production refactors needed for stable tests
- [x] T019 Make T009 pass by filling API behavior gaps in `app/api/bookings/route.ts`, `app/api/bookings/[bookingId]/invoice/route.ts`, `app/api/admin/bookings/pending/route.ts`, `tests/contracts/bookings-api.spec.ts`, and `tests/contracts/admin-booking-pending.spec.ts`
- [x] T020 Make T010 pass by covering dashboard component decision paths in `components/dashboard/UserPageContainer.tsx`, `components/dashboard/UserBreadcrumb.tsx`, `components/dashboard/InvoiceDownloadButton.tsx`, `tests/unit/components/UserPageContainer.spec.tsx`, `tests/unit/components/UserBreadcrumb.spec.tsx`, and `tests/unit/components/InvoiceDownloadButton.spec.tsx`
- [x] T021 Make T011 pass by strengthening authenticated dashboard and course journey behavior in `app/dashboard/page.tsx`, `app/my-courses/page.tsx`, `app/user-profile/[[...user-profile]]/page.tsx`, `tests/e2e/dashboard.spec.ts`, and `tests/e2e/dashboard-sections.spec.ts`

## Phase 3.4: Integration

- [x] T022 Expand measured coverage scope and threshold strategy in `jest.config.ts` using the typed catalogs from `tests/coverage/`, while keeping exact hard-gate numbers baseline-driven rather than guessed up front
- [x] T023 Wire local coverage execution and pull-request enforcement in `package.json` and `.github/workflows/ci.yml`
- [x] T024 Wire deploy-time coverage artifact upload and hard-gate rollout in `.github/workflows/deploy.yml`

## Phase 3.5: Polish

- [x] T025 [P] Document the coverage workflow, baseline interpretation, and critical-area ownership in `docs/tests/test-coverage.md`
- [x] T026 [P] Update journey-focused execution guidance in `docs/tests/e2e.md`
- [x] T027 Run the full validation sequence (`npm run typecheck`, `npm run lint`, `npm run test:unit -- --coverage --runInBand`, `npm run test:contracts -- --runInBand`, `npm run test:e2e -- --project=chromium-auth`) and record the final evidence plus follow-up threshold decisions in `docs/tests/test-coverage-baseline.md`

## Dependencies

- T001-T003 before any test or implementation work
- T004-T011 must exist and fail before T012-T024 starts
- T012-T016 block T017, T022, and any logic that imports typed coverage catalogs
- T017 depends on T002-T006 and T012-T016
- T018 depends on T007-T008
- T019 depends on T009
- T020 depends on T010
- T021 depends on T011
- T022 depends on T012-T021
- T023 depends on T017 and T022
- T024 depends on T022-T023
- T025-T026 depend on T022-T024
- T027 depends on T001-T026

## Parallel Execution Examples

### Example 1: Initial failing tests

```text
Task: "T004 Add the contract test for specs/028-test-coverage/contracts/coverage-gates.md in tests/contracts/coverage-gates.spec.ts"
Task: "T005 Add the maintainer baseline workflow integration test in tests/integration/coverage-baseline.spec.ts"
Task: "T006 Add the contributor critical-area workflow integration test in tests/integration/coverage-workflow.spec.ts"
Task: "T007 Add failing backend critical-area unit tests for lib/services/booking.ts in tests/unit/lib/services/booking.spec.ts"
Task: "T008 Add failing backend critical-area unit tests for lib/services/prerequisite.ts in tests/unit/lib/services/prerequisite.spec.ts"
Task: "T010 Add failing dashboard component tests for components/dashboard/UserPageContainer.tsx and components/dashboard/UserBreadcrumb.tsx in tests/unit/components/UserPageContainer.spec.tsx and tests/unit/components/UserBreadcrumb.spec.tsx"
```

### Example 2: Parallel model creation

```text
Task: "T012 Implement the CoverageBaseline model in tests/coverage/coverage-baseline.ts"
Task: "T013 Implement the CriticalArea model in tests/coverage/critical-areas.ts"
Task: "T014 Implement the CoverageTarget model in tests/coverage/coverage-targets.ts"
Task: "T015 Implement the TestWorkstream model in tests/coverage/test-workstreams.ts"
Task: "T016 Implement the QualityGateDefinition model in tests/coverage/quality-gates.ts"
```

### Example 3: Parallel polish work

```text
Task: "T025 Document the coverage workflow, baseline interpretation, and critical-area ownership in docs/tests/test-coverage.md"
Task: "T026 Update journey-focused execution guidance in docs/tests/e2e.md"
```

## Validation Checklist

- [x] All feature contract files have corresponding contract test tasks
- [x] All planning entities from `data-model.md` have model creation tasks
- [x] Tests are ordered before implementation
- [x] Parallel tasks touch different files or independent file sets
- [x] Every task specifies exact repository paths
- [x] CI gating, backend logic, API behavior, component coverage, and authenticated journeys are all covered