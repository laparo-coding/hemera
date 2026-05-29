# Tasks: Jest to Vitest Migration

**Input**: Design documents from `specs/029-jest-to-vitest-migration/`
**Prerequisites**: `specs/029-jest-to-vitest-migration/plan.md`, `specs/029-jest-to-vitest-migration/research.md`, `specs/029-jest-to-vitest-migration/data-model.md`, `specs/029-jest-to-vitest-migration/contracts/`, `specs/029-jest-to-vitest-migration/quickstart.md`

## Execution Flow (main)

```
1. Establish Vitest infrastructure alongside the current repository test surface
2. Convert shared setup and common Jest compatibility patterns
3. Migrate the unit suite first and make representative slices pass
4. Migrate contract and integration scopes without changing Playwright
5. Remove obsolete Jest-only configuration and update repository guidance
6. Run the full non-E2E validation sequence on Vitest
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Every task below includes exact repository paths

## Phase 3.1: Setup

- [ ] T001 Capture the current non-E2E baseline commands and outputs from `package.json`, `jest.config.ts`, `jest.contract.config.ts`, `jest.integration.config.ts`, and `tests/setup.ts` in `specs/029-jest-to-vitest-migration/research.md`
- [ ] T002 Add the Vitest infrastructure in `package.json`, `vitest.config.ts`, `tsconfig.json`, and `tests/setup.ts` while keeping Playwright scripts unchanged
- [ ] T003 Add Jest-compat support files for the migration in `tests/vitest/jest-globals.ts` and any required helper types or utilities

## Phase 3.2: Tests First (Compatibility Slice)

- [ ] T004 [P] Add a unit migration regression test for a Node-oriented service path in `tests/unit/services/booking.spec.ts`
- [ ] T005 [P] Add a unit migration regression test for a jsdom-backed component path in `tests/unit/components/PreparationSection.spec.tsx`
- [ ] T006 [P] Add a contract migration regression check in `tests/contracts/summary.contract.spec.ts`
- [ ] T007 [P] Add an integration migration regression check in `tests/integration/coverage-baseline.spec.ts`

## Phase 3.3: Compatibility and Unit Migration

- [ ] T008 Bulk-convert `@jest/globals` imports and common `jest.*` runtime helpers to the approved Vitest model across `tests/unit/**`, `tests/contracts/**`, `tests/integration/**`, and `tests/setup.ts`
- [ ] T009 Replace `jest.requireActual` usage with Vitest-compatible imports in `tests/unit/components/CourseProgressStepper.spec.tsx`, `tests/unit/components/TestimonialDrawer.spec.tsx`, `tests/unit/components/course-detail/CourseHeroSection.spec.tsx`, and `tests/unit/api/courses.spec.ts`
- [ ] T010 Make the representative Node and jsdom unit migration slices pass under Vitest, touching only the minimum required files in `tests/unit/**` and supporting helpers
- [ ] T011 Switch `test`, `test:unit`, `test:unit:coverage`, and `test:watch` in `package.json` to Vitest-backed entry points

## Phase 3.4: Contract and Integration Migration

- [ ] T012 Migrate the contract suite to Vitest and make `tests/contracts/**` pass with shared setup, alias resolution, and mocking intact
- [ ] T013 Migrate the integration suite to Vitest and preserve the intentional ignore list from `jest.integration.config.ts` in `vitest.config.ts`
- [ ] T014 Preserve coverage output parity for `text`, `lcov`, `html`, and `json-summary` in `vitest.config.ts` and any supporting scripts referenced by `package.json`

## Phase 3.5: Cleanup and Validation

- [ ] T015 Remove obsolete Jest-only config or dependency surface in `jest.config.ts`, `jest.contract.config.ts`, `jest.integration.config.ts`, and `package.json` once Vitest parity is proven
- [ ] T016 Update migration guidance and execution steps in `specs/029-jest-to-vitest-migration/quickstart.md` and any repository docs that mention Jest-only non-E2E execution
- [ ] T017 Run and record the final validation sequence: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:unit:coverage`, `npm run test:contracts`, and `npm run test:integration`
- [ ] T018 Profile slow or stateful Vitest suites and replace the current global `testTimeout`, `hookTimeout`, and sequential runner defaults with targeted per-suite overrides where safe

## Dependencies

- T001-T003 before broader migration edits
- T004-T007 before T010-T014
- T008-T009 before T010-T013
- T010 before T011-T013
- T011 before T017
- T012-T014 before T015-T017
- T015-T016 before T017

## Validation Checklist

- [ ] Tasks preserve separate unit, contract, and integration scopes
- [ ] Tasks keep Playwright outside the migration scope
- [ ] Tasks address shared setup, alias resolution, and mock compatibility
- [ ] Tasks include cleanup of Jest-only configuration after parity is proven