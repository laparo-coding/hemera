# Tasks: Admin Dashboard Redesign

**Feature**: 024-admin-dashboard
**Input**: Design documents from `/specs/024-admin-dashboard/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root

---

## Phase 3.1: Setup

- [ ] T001 Create `lib/constants/admin.ts` with layout constants (ADMIN_LAYOUT, ADMIN_ROUTES)
- [ ] T002 Create TypeScript interfaces for API responses in `lib/types/admin.ts` (AdminUserListItem, DashboardStats, HealthStatus)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P]

- [ ] T003 [P] Contract test GET /api/admin/users in `tests/contracts/admin-users-api.spec.ts`
- [ ] T004 [P] Contract test PATCH /api/admin/users/{userId} in `tests/contracts/admin-users-api.spec.ts`
- [ ] T005 [P] Contract test DELETE /api/admin/users/{userId} in `tests/contracts/admin-users-api.spec.ts`
- [ ] T006 [P] Contract test GET /api/admin/reports/stats in `tests/contracts/admin-reports-api.spec.ts`
- [ ] T007 [P] Contract test GET /api/admin/reports/health in `tests/contracts/admin-reports-api.spec.ts`

### E2E Tests [P]

- [ ] T008 [P] E2E test dashboard layout (6 cards, no footer) in `tests/e2e/admin-dashboard.spec.ts`
- [ ] T009 [P] E2E test breadcrumb navigation in `tests/e2e/admin-dashboard.spec.ts`
- [ ] T010 [P] E2E test course publish toggle in `tests/e2e/admin-courses.spec.ts`
- [ ] T011 [P] E2E test user management (list, filter, outperformer) in `tests/e2e/admin-users.spec.ts`
- [ ] T012 [P] E2E test reports page (health status, stats) in `tests/e2e/admin-reports.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Shared Components [P]

- [ ] T013 [P] Create `components/admin/AdminBreadcrumb.tsx` - Breadcrumb with `>` separator, MUI Breadcrumbs
- [ ] T014 [P] Create `components/admin/AdminPageContainer.tsx` - Wrapper with head space constants
- [ ] T015 [P] Create `components/admin/DashboardCard.tsx` - Clickable card with icon, title, hover effect

### API Service Layer [P]

- [ ] T016 [P] Create `lib/api/admin-users.ts` - Clerk user listing with pagination, outperformer merge
- [ ] T017 [P] Create `lib/api/admin-reports.ts` - Statistics aggregation (bookings, revenue, courses, users)

### API Routes

- [ ] T018 Create `app/api/admin/users/route.ts` - GET (list users with pagination, filter)
- [ ] T019 Create `app/api/admin/users/[userId]/route.ts` - PATCH (update outperformer/role), DELETE (delete user)
- [ ] T020 Create `app/api/admin/reports/stats/route.ts` - GET dashboard statistics
- [ ] T021 Create `app/api/admin/reports/health/route.ts` - GET extended health status

### UI Components [P]

- [ ] T022 [P] Create `components/admin/UserList.tsx` - User table with Outperformer toggle, role badge, filter
- [ ] T023 [P] Create `components/admin/ReportsPanel.tsx` - Health status cards, stats display, refresh button

### Page Implementations

- [ ] T024 Modify `app/admin/layout.tsx` - Add breadcrumb slot, remove footer, set container maxWidth
- [ ] T025 Modify `app/admin/page.tsx` - 3-column grid, 6 DashboardCards, German labels, remove welcome alert
- [ ] T026 Create `app/admin/users/page.tsx` - UserList integration with Clerk data
- [ ] T027 Create `app/admin/reports/page.tsx` - ReportsPanel with health + stats

### Existing Component Modifications

- [ ] T028 Modify `components/admin/PublishToggle.tsx` - Replace Button with MUI Switch
- [ ] T029 Modify `components/admin/CourseListWithDelete.tsx` - Use new toggle, remove status column
- [ ] T030 Modify `app/admin/courses/page.tsx` - German labels, align with new layout
- [ ] T031 Modify `app/admin/locations/page.tsx` - Remove search, align with courses layout
- [ ] T032 Modify `app/admin/locations/LocationsTableClient.tsx` - Remove search field, match courses table style

## Phase 3.4: Integration

- [ ] T033 Add Rollbar error logging to new API routes (users, reports)
- [ ] T034 Add request ID tracking to new API responses
- [ ] T035 Update existing admin pages to use AdminPageContainer wrapper

## Phase 3.5: Polish

- [ ] T036 [P] Add placeholder text and helperText to all input fields in admin forms
- [ ] T037 [P] Ensure all German translations are consistent (Lokalisierung audit)
- [ ] T038 Run `quickstart.md` validation checklist manually
- [ ] T039 Run full E2E test suite: `npx playwright test tests/e2e/admin-*.spec.ts`
- [ ] T040 Update AGENTS.md and copilot-instructions.md with completed feature

---

## Dependencies

```
T001, T002 (Setup) → All other tasks

T003-T007 (Contract Tests) → T018-T021 (API Routes)
T008-T012 (E2E Tests) → T024-T032 (UI Implementation)

T013-T015 (Shared Components) → T024-T027 (Pages)
T016-T017 (Service Layer) → T018-T021 (API Routes)

T018-T021 (API Routes) → T022-T023 (UI Components that call APIs)
T022-T023 (UI Components) → T026-T027 (Pages using those components)

T024 (Layout) → T025-T032 (All admin pages)
T028 (PublishToggle) → T029 (CourseListWithDelete)

T024-T032 (Implementation) → T033-T035 (Integration)
T033-T035 (Integration) → T036-T040 (Polish)
```

## Parallel Execution Examples

### Phase 3.2: All Contract + E2E Tests [P]
```bash
# Run all test tasks in parallel (T003-T012)
Task: "Contract test GET /api/admin/users in tests/contracts/admin-users-api.spec.ts"
Task: "Contract test PATCH /api/admin/users/{userId} in tests/contracts/admin-users-api.spec.ts"
Task: "Contract test DELETE /api/admin/users/{userId} in tests/contracts/admin-users-api.spec.ts"
Task: "Contract test GET /api/admin/reports/stats in tests/contracts/admin-reports-api.spec.ts"
Task: "Contract test GET /api/admin/reports/health in tests/contracts/admin-reports-api.spec.ts"
Task: "E2E test dashboard layout in tests/e2e/admin-dashboard.spec.ts"
Task: "E2E test breadcrumb navigation in tests/e2e/admin-dashboard.spec.ts"
Task: "E2E test course publish toggle in tests/e2e/admin-courses.spec.ts"
Task: "E2E test user management in tests/e2e/admin-users.spec.ts"
Task: "E2E test reports page in tests/e2e/admin-reports.spec.ts"
```

### Phase 3.3a: Shared Components + Service Layer [P]
```bash
# After Setup complete, run T013-T017 in parallel
Task: "Create components/admin/AdminBreadcrumb.tsx"
Task: "Create components/admin/AdminPageContainer.tsx"
Task: "Create components/admin/DashboardCard.tsx"
Task: "Create lib/api/admin-users.ts"
Task: "Create lib/api/admin-reports.ts"
```

### Phase 3.3b: UI Components [P]
```bash
# After API routes complete, run T022-T023 in parallel
Task: "Create components/admin/UserList.tsx"
Task: "Create components/admin/ReportsPanel.tsx"
```

### Phase 3.5: Polish [P]
```bash
# Run T036-T037 in parallel
Task: "Add placeholder text to admin forms"
Task: "German translation audit"
```

---

## Summary

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| 3.1 Setup | T001-T002 | Sequential |
| 3.2 Tests | T003-T012 | ✅ All parallel |
| 3.3 Core | T013-T032 | Partial (see deps) |
| 3.4 Integration | T033-T035 | Sequential |
| 3.5 Polish | T036-T040 | Partial |

**Total Tasks**: 40
**Estimated Effort**: 4-6 hours with parallel execution
