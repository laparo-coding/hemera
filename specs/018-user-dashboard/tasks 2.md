# Tasks: User Dashboard Enhancement

**Input**: Design documents from `/specs/018-user-dashboard/`  
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are absolute from repository root

---

## Phase 3.1: Setup

- [x] T001 Create Prisma migration for `Course.endDate` field in `prisma/migrations/YYYYMMDD_add_course_end_date/`
- [x] T002 Create Prisma migration for Booking invoice fields (`stripeInvoiceId`, `stripeInvoiceUrl`, `stripeInvoicePdfUrl`) in `prisma/migrations/YYYYMMDD_add_stripe_invoice_fields/`
- [x] T003 Update `prisma/schema.prisma` with new fields and run `npx prisma generate`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [x] T004 [P] Contract test GET /api/bookings (enhanced response) in `tests/integration/api/bookings.spec.ts`
- [x] T005 [P] Contract test GET /api/bookings/[bookingId]/invoice in `tests/integration/api/bookings-invoice.spec.ts`

### Component Unit Tests

- [x] T006 [P] Unit test `CourseCard` component in `tests/unit/components/CourseCard.spec.tsx`
- [x] T007 [P] Unit test `DashboardSection` component in `tests/unit/components/DashboardSection.spec.tsx`
- [x] T008 [P] Unit test `InvoiceDownloadButton` component in `tests/unit/components/InvoiceDownloadButton.spec.tsx`

### Service Unit Tests

- [x] T009 [P] Unit test `getInvoicePdfUrl` service in `tests/unit/services/stripe-invoice.spec.ts`
- [x] T010 [P] Unit test booking categorization logic in `tests/unit/services/booking-categorization.spec.ts`

### Integration Tests

- [x] T011 [P] Integration test dashboard sections display in `tests/integration/dashboard-sections.spec.ts`
- [x] T012 [P] Integration test user course detail page navigation in `tests/integration/user-course-detail.spec.ts`

### E2E Tests

- [x] T013 E2E test full dashboard flow in `tests/e2e/dashboard-sections.spec.ts`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Layer

- [x] T014 Update `app/api/bookings/route.ts` to include course dates, location, participation, invoice fields
- [x] T015 Create `app/api/bookings/[bookingId]/invoice/route.ts` for invoice download endpoint
- [x] T016 [P] Create `lib/services/stripe-invoice.ts` with `getInvoicePdfUrl()` function
- [x] T017 [P] Create `lib/utils/booking-categorization.ts` with categorization logic for 4 sections

### UI Components

- [x] T018 [P] Create `components/dashboard/CourseCard.tsx` with date/time/location display
- [x] T019 [P] Create `components/dashboard/DashboardSection.tsx` reusable section wrapper
- [x] T020 [P] Create `components/dashboard/InvoiceDownloadButton.tsx` with download handler

### Page Components

- [x] T021 Refactor `components/UserDashboard.tsx` to use 4-section layout with new components
- [x] T022 Create `app/my-courses/[bookingId]/page.tsx` for user course detail page
- [x] T023 [P] Create `components/participation/ResultsSection.tsx` for video + materials display
- [x] T024 [P] Create `components/participation/DebriefingSection.tsx` for summary display

### Webhook Update

- [x] T025 Update Stripe webhook handler to capture invoice data on `checkout.session.completed`

---

## Phase 3.4: Integration

- [x] T026 Connect invoice download button to API endpoint with error handling
- [x] T027 Add Rollbar error logging to invoice API and dashboard components
- [x] T028 Implement URL anchor navigation for course detail sections (#vorbereitung, #ergebnisse, #nachbereitung)
- [x] T029 Update `app/dashboard/page.tsx` to use enhanced UserDashboard component

---

## Phase 3.5: Polish

- [x] T030 [P] Verify responsive layout for mobile (< 768px) in `tests/e2e/dashboard-mobile.spec.ts`
- [x] T031 [P] Performance test dashboard load < 2s in `tests/e2e/dashboard-performance.spec.ts`
- [x] T032 [P] Update `specs/018-user-dashboard/quickstart.md` with final validation checklist
- [x] T033 Run full E2E test suite and fix any failures
- [ ] T034 Manual testing per quickstart.md validation checklist

---

## Dependencies

```
T001, T002 → T003 (migrations before generate)
T003 → T004-T013 (schema before tests)
T004-T013 → T014-T025 (tests before implementation - TDD)
T014 → T021 (API before dashboard refactor)
T018-T020 → T021 (components before dashboard assembly)
T022 → T028 (page before anchor navigation)
T025 → T026 (webhook before button integration)
T014-T029 → T030-T034 (implementation before polish)
```

---

## Parallel Execution Examples

### Phase 3.2 - Contract & Unit Tests (can run in parallel)

```bash
# Launch T004-T012 together (different files):
Task: "Contract test GET /api/bookings in tests/integration/api/bookings.spec.ts"
Task: "Contract test GET /api/bookings/[bookingId]/invoice in tests/integration/api/bookings-invoice.spec.ts"
Task: "Unit test CourseCard component in tests/unit/components/CourseCard.spec.tsx"
Task: "Unit test DashboardSection component in tests/unit/components/DashboardSection.spec.tsx"
Task: "Unit test InvoiceDownloadButton component in tests/unit/components/InvoiceDownloadButton.spec.tsx"
Task: "Unit test getInvoicePdfUrl service in tests/unit/services/stripe-invoice.spec.ts"
Task: "Unit test booking categorization logic in tests/unit/services/booking-categorization.spec.ts"
Task: "Integration test dashboard sections display in tests/integration/dashboard-sections.spec.ts"
Task: "Integration test user course detail page in tests/integration/user-course-detail.spec.ts"
```

### Phase 3.3 - Independent Components (can run in parallel)

```bash
# Launch T16-T20, T23-T24 together:
Task: "Create lib/services/stripe-invoice.ts with getInvoicePdfUrl()"
Task: "Create lib/utils/booking-categorization.ts"
Task: "Create components/dashboard/CourseCard.tsx"
Task: "Create components/dashboard/DashboardSection.tsx"
Task: "Create components/dashboard/InvoiceDownloadButton.tsx"
Task: "Create components/participation/ResultsSection.tsx"
Task: "Create components/participation/DebriefingSection.tsx"
```

---

## Validation Checklist

_GATE: Verify before marking feature complete_

- [ ] All contract tests pass (T004, T005)
- [ ] All unit tests pass (T006-T010)
- [ ] All integration tests pass (T011-T012)
- [ ] All E2E tests pass (T013, T030-T031)
- [ ] Dashboard displays 4 sections correctly
- [ ] Empty sections are hidden
- [ ] Course cards show date/time/location
- [ ] Invoice download works for paid bookings
- [ ] User course detail page navigable via URL anchors
- [ ] Mobile responsive layout verified
- [ ] Dashboard loads in < 2 seconds
- [ ] All German localization uses "Du" form
- [ ] Rollbar error monitoring active

---

## Notes

- **TDD Workflow**: Tests in Phase 3.2 must fail before implementing Phase 3.3
- **Commit Strategy**: Commit after each completed task
- **Parallel Safety**: [P] tasks modify different files, no conflicts
- **Error Handling**: All API routes must log to Rollbar
- **Localization**: All UI text in informal German ("Dein Kurs", "Deine Buchung")
