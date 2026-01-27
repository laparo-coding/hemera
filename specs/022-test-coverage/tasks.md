# Tasks: Test Coverage (022)

**Input**: Design documents from `/specs/022-test-coverage/`
**Prerequisites**: plan.md ✅, research.md ✅, quickstart.md ✅

## Execution Summary

- **Total Tasks**: 22
- **Parallel Tasks**: 10 (marked [P])
- **Sequential Tasks**: 12

## Phase 3.1: Setup & Configuration

- [x] T001 Remove component test exclusion from `tsconfig.json`
  - File: `tsconfig.json`
  - Action: Remove line `"tests/unit/components/**/*.spec.tsx"` from exclude array
  - Verify: `npm run typecheck` passes

- [x] T002 Add coverage thresholds to `jest.config.ts`
  - File: `jest.config.ts`
  - Action: Add `coverageThreshold` with 70% global, 85% for `lib/services/`
  - Verify: `npm test -- --coverage` shows thresholds

- [x] T003 Add no-console rule to `biome.json`
  - File: `biome.json`
  - Action: Add `"noConsole": "error"` under `linter.rules.suspicious`
  - Note: Initially set to `"warn"` until console.log migration complete

- [x] T004 [P] Add Playwright auth setup project to `playwright.config.ts`
  - File: `playwright.config.ts`
  - Action: Add `setup`, `chromium-auth`, `chromium-no-auth`, `production-smoke` projects
  - Depends on: T005 for auth-setup.ts

## Phase 3.2: Auth & Workflow Setup

- [x] T005 Create Playwright auth setup script
  - File: `tests/e2e/auth-setup.ts`
  - Action: Create script that logs in via Clerk and saves to `.auth/user.json`
  - Uses: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` env vars
  - Verify: `npx playwright test --project=setup` creates `.auth/user.json`

- [x] T006 Add `.auth/` to `.gitignore`
  - File: `.gitignore`
  - Action: Add `.auth/` directory to ignore list

- [x] T007 Create production smoke test workflow
  - File: `.github/workflows/production-smoke.yml`
  - Action: Create scheduled workflow (daily 6 AM UTC)
  - Includes: Slack/Email alerting on failure
  - Verify: Workflow appears in GitHub Actions

- [ ] T008 [P] Add CI secrets for E2E test credentials
  - Location: GitHub Repository Settings > Secrets
  - Secrets: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`
  - Note: Document in `docs/development/e2e-setup.md`

## Phase 3.3: Test Fixes (Issue #384, #357)

- [x] T009 Fix Course-Detail E2E timeout (Issue #384)
  - File: `tests/e2e/course-detail.spec.ts`
  - Actions:
    1. Remove `test.describe.skip()`
    2. Add health endpoint warmup before navigation
    3. Increase timeout to 120s for this suite
    4. Use `waitUntil: 'domcontentloaded'` instead of `'load'`
  - Verify: `npx playwright test course-detail.spec.ts` passes locally

- [ ] T010 Enable authenticated checkout tests
  - File: `tests/e2e/checkout.spec.ts`
  - Action: Update `test.skip()` conditions to use new auth project
  - Depends on: T005 (auth-setup)
  - Verify: Checkout tests run with `--project=chromium-auth`

- [x] T011 Close Issue #357 (Component Testing)
  - Depends on: T001 (tsconfig fix)
  - Action: Verify all 43 component tests pass, then close GitHub issue
  - Command: `npm test -- tests/unit/components/`

## Phase 3.4: Console.log → Rollbar Migration

- [x] T012 [P] Migrate console.log in `app/api/**`
  - Scope: All API route handlers
  - Replace: `console.error` → `serverInstance.error()` from `@/lib/monitoring/rollbar-official`
  - Replace: `console.log` → Remove or `serverInstance.info()`
  - Skip: `lib/monitoring/**` (Rollbar setup files)

- [x] T013 [P] Migrate console.log in `lib/services/**`
  - Scope: All service files
  - Replace: `console.error` → `serverInstance.error()`
  - Replace: `console.log` → Remove debug logs
  - Verify: `grep -r "console\." lib/services/` returns 0

- [x] T014 [P] Migrate console.log in `lib/api/**`
  - Scope: API helper files
  - Replace: Same pattern as T012
  - Verify: `grep -r "console\." lib/api/` returns 0

- [x] T015 [P] Migrate console.log in `components/**`
  - Scope: React components (especially Error Boundaries)
  - Replace: `console.error` → `useRollbar().error()` in Error Boundaries
  - Skip: Development-only logging with `if (process.env.NODE_ENV === 'development')`

- [x] T016 Verify no-console rule passes
  - Depends on: T003, T012-T015
  - Action: Change biome.json rule from `"warn"` to `"error"`
  - Verify: `npm run lint` passes with 0 console.* violations

## Phase 3.5: New E2E Tests

- [x] T017 Create Invoice Download E2E test
  - File: `tests/e2e/invoice-download.spec.ts`
  - Test Cases:
    1. Authenticated user can see invoice button on dashboard
    2. Clicking invoice button downloads PDF (verify Content-Type)
    3. Unauthenticated user cannot access invoice
  - Depends on: T005 (auth-setup)

- [x] T018 Create Production Smoke test spec
  - File: `tests/e2e/production-smoke.spec.ts`
  - Test Cases:
    1. Homepage loads
    2. Course listing loads
    3. Login with test user succeeds
    4. Dashboard accessible after login
  - Note: Read-only tests, no data modifications

## Phase 3.6: Coverage & CI Integration

- [ ] T019 Add coverage reporting to CI workflow
  - File: `.github/workflows/ci.yml` (or equivalent)
  - Action: Add coverage upload step (jest-coverage or codecov)
  - Action: Add coverage comment to PR

- [ ] T020 Verify coverage thresholds met
  - Command: `npm test -- --coverage`
  - Verify: Global ≥ 70%, lib/services/ ≥ 85%
  - If failing: Identify gaps in coverage report

## Phase 3.7: Verification & Cleanup

- [ ] T021 Run full test suite
  - Commands:
    ```bash
    npm run typecheck
    npm run lint
    npm test -- --coverage
    npx playwright test
    ```
  - Verify: All checks pass

- [ ] T022 Close related GitHub Issues
  - Close #357 (Component Testing) if T011 passed
  - Close #384 (Course-Detail Timeout) if T009 passed
  - Update PR description with summary

## Dependencies

```
T001 → T011 (tsconfig enables component tests)
T003 → T016 (biome rule after migration)
T004 → T005 (config needs auth-setup script)
T005 → T009, T010, T017, T018 (auth-setup enables all auth tests)
T012-T015 → T016 (migration before rule enforcement)
T001-T020 → T021 (all tasks before verification)
```

## Parallel Execution Examples

### Batch 1: Configuration (can run together)
```bash
# T001, T002, T003, T006 - different config files
Task: "Remove component test exclusion from tsconfig.json"
Task: "Add coverage thresholds to jest.config.ts"
Task: "Add no-console rule to biome.json"
Task: "Add .auth/ to .gitignore"
```

### Batch 2: Console.log Migration (can run together)
```bash
# T012, T013, T014, T015 - different directories
Task: "Migrate console.log in app/api/**"
Task: "Migrate console.log in lib/services/**"
Task: "Migrate console.log in lib/api/**"
Task: "Migrate console.log in components/**"
```

### Batch 3: New E2E Tests (can run together after T005)
```bash
# T017, T018 - different test files
Task: "Create Invoice Download E2E test"
Task: "Create Production Smoke test spec"
```

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) |
|---------------------|---------|
| Stripe Checkout E2E läuft | T010 |
| Invoice Download Test | T017 |
| Production Login Test | T018, T007 |
| Course-Detail Tests (#384) | T009 |
| Component Tests (#357) | T001, T011 |
| Jest-DOM Matchers | T001 |
| tsconfig exclude entfernt | T001 |
| CI grün | T021 |
| Coverage Report | T019, T020 |
| Keine console.log | T012-T016 |
| Rollbar Logging | T012-T015 |
| Biome no-console aktiv | T003, T016 |
