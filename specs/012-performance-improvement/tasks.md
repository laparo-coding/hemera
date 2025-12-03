# Tasks: Initial Page Load Optimization

**Feature**: 012-performance-improvement  
**Date**: 2025-12-03  
**Source Documents**: spec.md, research.md, data-model.md, contracts/, quickstart.md

---

## Execution Flow (/tasks command scope)

```
1. Load design documents from /plan output
   → research.md, data-model.md, contracts/, quickstart.md
2. Parse requirements from spec.md
   → FR-001 to FR-009, NFR-001 to NFR-005
3. Generate tasks following TDD workflow:
   → Setup → Tests → Core → Integration → Polish
4. Mark parallel-safe tasks with [P]
5. Output tasks.md with dependency graph
```

---

## Task Legend

- **[P]** = Parallelizable (no dependencies on concurrent tasks)
- **Priority**: P0 (blocking), P1 (core), P2 (polish)
- **Status**: ⬜ Not Started, 🔄 In Progress, ✅ Done

---

## Phase 1: Setup

### T001 [P0] Create Lighthouse CI Configuration

**File**: `lighthouserc.js` (new)  
**Depends on**: None  
**Acceptance**:

- [ ] File exists at project root
- [ ] Assertions for FCP, LCP, CLS, TBT defined
- [ ] Temporary public storage configured for reports

```javascript
// Expected structure from data-model.md
module.exports = {
  ci: {
    collect: { url: ['http://localhost:3000/'], numberOfRuns: 3 },
    assert: {
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

---

### T002 [P0] Update next.config.mjs with Webpack Optimizations

**File**: `next.config.mjs`  
**Depends on**: None  
**Acceptance**:

- [ ] `webpackMemoryOptimizations: true` enabled in experimental
- [ ] Build completes without "[webpack.cache.PackFileCacheStrategy] Serializing big strings"
      warning
- [ ] No breaking changes to existing config

**Reference**: FR-009, NFR-005

---

### T003 [P0] [P] Install Bundle Analyzer (Optional)

**File**: `package.json`  
**Depends on**: None  
**Acceptance**:

- [ ] `@next/bundle-analyzer` added as devDependency
- [ ] `ANALYZE=true npm run build` produces bundle analysis
- [ ] No production impact

---

## Phase 2: Tests (TDD - Write Tests First)

### T004 [P1] Create Lighthouse CI Performance Tests

**File**: `tests/e2e/performance.spec.ts` (new)  
**Depends on**: T001  
**Acceptance**:

- [ ] Test measures FCP < 1.8s
- [ ] Test measures LCP < 2.5s
- [ ] Test measures CLS < 0.1
- [ ] Test can run locally with `npm run test:e2e`

**Reference**: NFR-001, NFR-002, NFR-003, NFR-004

---

### T005 [P1] [P] Create Rollbar Deferred Loading Test

**File**: `tests/e2e/performance.spec.ts`  
**Depends on**: T004  
**Acceptance**:

- [ ] Test verifies Rollbar scripts NOT loaded before FCP
- [ ] Test verifies Rollbar functional after page load
- [ ] Test uses Network interception to verify load order

**Reference**: FR-002, Deferred Components section

---

### T006 [P1] [P] Create Navigation Interactivity Test

**File**: `tests/e2e/performance.spec.ts`  
**Depends on**: T004  
**Acceptance**:

- [ ] Test verifies navigation clickable immediately after load
- [ ] Test verifies primary CTA interactive within 500ms
- [ ] Test measures Time to Interactive (TTI)

**Reference**: FR-001, FR-003

---

### T007 [P1] [P] Create Lazy Loading Scroll Test

**File**: `tests/e2e/performance.spec.ts`  
**Depends on**: T004  
**Acceptance**:

- [ ] Test verifies below-fold content NOT in initial bundle
- [ ] Test scrolls and verifies content loads
- [ ] Test measures CLS during scroll

**Reference**: FR-004

---

## Phase 3: Core Implementation

### T008 [P1] Defer MonitoringInit with lazyOnload Strategy

**File**: `components/MonitoringInit.tsx`  
**Depends on**: T005 (test exists)  
**Acceptance**:

- [ ] Use `next/script` with `strategy="lazyOnload"`
- [ ] Rollbar initializes after browser idle
- [ ] Error tracking still functional
- [ ] T005 test passes

**Reference**: FR-002, research.md Script Loading section

```tsx
// Pattern from Next.js official docs
<Script src='rollbar.min.js' strategy='lazyOnload' />
```

---

### T009 [P1] Create Loading.tsx for Root Layout

**File**: `app/loading.tsx` (new if not exists)  
**Depends on**: None  
**Acceptance**:

- [ ] Skeleton UI matches landing page layout
- [ ] Uses MUI Skeleton components
- [ ] Prevents CLS during page load

**Reference**: FR-007

---

### T010 [P1] Dynamic Import for UserMenu Component

**File**: `components/navigation/` (identify exact file)  
**Depends on**: T006 (test exists)  
**Acceptance**:

- [ ] UserMenu uses `next/dynamic` with `{ ssr: false }`
- [ ] Loading state shown during load
- [ ] Navigation remains interactive without UserMenu

**Reference**: FR-001, data-model.md Component Classification

```tsx
// Pattern
const UserMenu = dynamic(() => import('./UserMenu'), {
  ssr: false,
  loading: () => <Skeleton variant='circular' width={40} height={40} />,
});
```

---

### T011 [P1] [P] Dynamic Import for Features Section

**File**: `components/landing/Features.tsx`  
**Depends on**: T007 (test exists)  
**Acceptance**:

- [ ] Features component lazy loaded with Suspense
- [ ] Skeleton UI during load
- [ ] No CLS when content appears

**Reference**: FR-004, data-model.md Component Classification

---

### T012 [P1] [P] Dynamic Import for Testimonials Section

**File**: `components/landing/Testimonials.tsx`  
**Depends on**: T007 (test exists)  
**Acceptance**:

- [ ] Testimonials lazy loaded on scroll approach
- [ ] IntersectionObserver triggers load
- [ ] Skeleton placeholder visible before load

**Reference**: FR-004

---

### T013 [P1] [P] Optimize Footer Loading

**File**: `components/landing/Footer.tsx` (or appropriate location)  
**Depends on**: T007 (test exists)  
**Acceptance**:

- [ ] Footer lazy loaded with low priority
- [ ] Does not block initial render
- [ ] Loads on scroll near bottom

**Reference**: data-model.md (Footer = Low priority)

---

### T014 [P1] Verify Critical Path Components SSR

**Files**: `components/navigation/`, `components/landing/Hero.tsx`  
**Depends on**: T006  
**Acceptance**:

- [ ] Navigation renders on server (no dynamic import)
- [ ] Hero section renders on server
- [ ] Primary CTA in initial HTML
- [ ] No flash of unstyled content

**Reference**: FR-001, FR-003, FR-008

---

## Phase 4: Integration

### T015 [P1] Add Lighthouse CI to GitHub Actions

**File**: `.github/workflows/deploy.yml` (or appropriate workflow)  
**Depends on**: T001, T004  
**Acceptance**:

- [ ] Lighthouse CI runs on PR
- [ ] Results uploaded to temporary storage
- [ ] LCP failure blocks merge
- [ ] FCP/TTI warnings visible in PR

**Reference**: contracts/performance-budget.md

```yaml
# Pattern
- name: Lighthouse CI
  run: |
    npm run build
    npm run start &
    sleep 5
    npx @lhci/cli autorun
```

---

### T016 [P1] Validate Build Cache Warning Fixed

**Depends on**: T002  
**Acceptance**:

- [ ] `npm run build` produces no webpack cache warnings
- [ ] Build time comparable or better than before
- [ ] `.next/cache` size reasonable

**Reference**: FR-009, NFR-005

---

### T017 [P1] Run Full E2E Test Suite

**Depends on**: T008-T014  
**Acceptance**:

- [ ] All existing E2E tests pass
- [ ] New performance tests pass
- [ ] No regressions in functionality

**Reference**: FR-005

---

### T018 [P1] Measure Before/After Performance

**Depends on**: T015  
**Acceptance**:

- [ ] Baseline metrics captured (from existing site)
- [ ] Post-optimization metrics captured
- [ ] FCP improvement documented
- [ ] LCP improvement documented

**Reference**: FR-006

---

## Phase 5: Polish

### T019 [P2] [P] Update quickstart.md with Final Results

**File**: `specs/012-performance-improvement/quickstart.md`  
**Depends on**: T018  
**Acceptance**:

- [ ] Acceptance criteria table completed
- [ ] Before/after metrics documented
- [ ] All checkboxes marked

---

### T020 [P2] [P] Document Performance Best Practices

**File**: `docs/performance/README.md` (new)  
**Depends on**: T008-T014  
**Acceptance**:

- [ ] Loading priority guidelines documented
- [ ] Dynamic import patterns documented
- [ ] Lighthouse CI usage explained

---

### T021 [P2] [P] Update .github/copilot-instructions.md

**File**: `.github/copilot-instructions.md`  
**Depends on**: T020  
**Acceptance**:

- [ ] Performance guidelines added to agent context
- [ ] Reference to 012-performance-improvement added

---

### T022 [P2] Review and Remove Bundle Analyzer

**Depends on**: T018  
**Acceptance**:

- [ ] Bundle analyzer removed from devDependencies (if added)
- [ ] Or kept with clear documentation for future use

---

### T023 [P2] Final Validation Against Spec

**Depends on**: All previous tasks  
**Acceptance**:

- [ ] FR-001 to FR-009 verified
- [ ] NFR-001 to NFR-005 verified
- [ ] quickstart.md checklist complete
- [ ] No breaking changes confirmed

---

## Dependency Graph

```
T001 (Lighthouse config) ──┬──> T004 (Perf tests) ──┬──> T008 (MonitoringInit)
                          │                        ├──> T010 (UserMenu)
T002 (next.config) ───────┼──> T016 (Validate)     ├──> T011 (Features) [P]
                          │                        ├──> T012 (Testimonials) [P]
T003 (Bundle analyzer) [P]│                        └──> T013 (Footer) [P]
                          │
                          └──> T015 (GitHub Actions) ──> T018 (Metrics)

T009 (loading.tsx) ────────────────────────────────────> T017 (Full E2E)

T014 (Verify SSR) ─────────────────────────────────────> T017 (Full E2E)

T017 ──> T018 ──> T019-T023 (Polish) [P]
```

---

## Execution Order (Recommended)

### Sprint 1: Foundation (Parallelizable)

1. T001, T002, T003 [P] - Setup

### Sprint 2: Tests First (TDD)

2. T004 - Create base performance test file
3. T005, T006, T007 [P] - Specific test cases

### Sprint 3: Core Implementation

4. T008 - MonitoringInit (highest impact)
5. T009 - loading.tsx
6. T010, T011, T012, T013 [P] - Component lazy loading
7. T014 - Verify SSR

### Sprint 4: Integration & Validation

8. T015 - GitHub Actions
9. T016, T017, T018 - Validation

### Sprint 5: Polish (Parallelizable)

10. T019, T020, T021, T022, T023 [P] - Documentation

---

## Status Tracking

| Phase       | Tasks     | Completed | Progress    |
| ----------- | --------- | --------- | ----------- |
| Setup       | T001-T003 | 3/3       | ✅ 100%     |
| Tests       | T004-T007 | 4/4       | ✅ 100%     |
| Core        | T008-T014 | 7/7       | ✅ 100%     |
| Integration | T015-T018 | 4/4       | ✅ 100%     |
| Polish      | T019-T023 | 5/5       | ✅ 100%     |
| **Total**   | **23**    | **23/23** | **✅ 100%** |

---

## Notes

- **TDD Workflow**: Tests in Phase 2 must pass before their corresponding Core tasks
- **Parallel Execution**: Tasks marked [P] can be executed in parallel within their phase
- **Rollback Strategy**: Each task is atomic; if a task fails, revert only that change
- **Validation**: After each Core task, run relevant E2E test to confirm no regression
