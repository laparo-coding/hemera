# Tasks: 021 Learning Path

**Input**: Design documents from `/specs/021-learning-path/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root

---

## Phase 3.1: Setup & Database

- [x] T001 Install Loops.so SDK dependency (`npm install loops`)
- [x] T002 Update Prisma schema with Learning Path fields in `prisma/schema.prisma`
  - Add `PRE_BOOKED` to PaymentStatus enum
  - Add Course fields: `recommended`, `notRecommended`, `isNonPublic`
  - Add User field: `isOutperformer`
  - Add Booking fields: `reviewedAt`, `reviewedBy`
- [x] T003 Create and apply Prisma migration (`npx prisma migrate dev --name learning_path`)
- [x] T004 [P] Create Zod schema for course learning path fields in `lib/schemas/admin/course.ts`
- [x] T005 [P] Create Zod schema for booking review action in `lib/schemas/admin/booking.ts`
- [x] T006 [P] Create Zod schema for user outperformer update in `lib/schemas/admin/user.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [x] T007 [P] Contract test GET /api/admin/bookings/pending in `tests/contracts/admin-booking-pending.spec.ts`
  - Test: Returns array of PendingBooking objects
  - Test: Requires admin auth
  - Test: Returns 401 for unauthenticated
  - Test: Returns 403 for non-admin
- [x] T008 [P] Contract test PATCH /api/admin/bookings/{id}/review in `tests/contracts/admin-booking-review.spec.ts`
  - Test: Approve changes PRE_BOOKED → PENDING
  - Test: Reject changes PRE_BOOKED → CANCELLED
  - Test: Returns 400 for non-PRE_BOOKED booking
  - Test: Returns 404 for unknown booking
  - Test: Sets reviewedAt and reviewedBy

### Unit Tests (Services)

- [x] T009 [P] Unit test PrerequisiteService in `tests/unit/services/prerequisite.spec.ts`
  - Test: BEGINNER always qualified
  - Test: INTERMEDIATE with no completed courses → not qualified
  - Test: INTERMEDIATE with completed BEGINNER → qualified
  - Test: ADVANCED with completed INTERMEDIATE → qualified
  - Test: ADVANCED with only BEGINNER → not qualified
  - Test: Uses all Clerk emails for user lookup
  - Test: Only counts PAID + COMPLETE participations
- [x] T010 [P] Unit test LoopsService (mocked) in `tests/unit/services/loops.spec.ts`
  - Test: sendPrerequisiteReviewEmail calls Loops API correctly
  - Test: sendBookingRejectedEmail calls Loops API correctly
  - Test: API failure returns { success: false, error } without throwing
  - Test: getAdminEmails fetches from Clerk

### Integration Tests

- [x] T011 [P] Integration test prerequisite booking flow in `tests/integration/booking-prerequisite.spec.ts`
  - Test: Non-qualified user gets PRE_BOOKED status
  - Test: Qualified user gets PENDING status
  - Test: Warning message shown for PRE_BOOKED
- [x] T012 [P] Integration test admin review workflow in `tests/integration/admin-review.spec.ts`
  - Test: Admin can approve PRE_BOOKED → PENDING
  - Test: Admin can reject PRE_BOOKED → CANCELLED + email

## Phase 3.3: Service Layer Implementation (ONLY after tests are failing)

- [ ] T013 Create PrerequisiteService in `lib/services/prerequisite.ts`
  - Implement `checkPrerequisite(clerkUserId, targetCourseLevel)`
  - Query Clerk for all user emails
  - Query completed courses via Prisma
  - Return PrerequisiteResult interface
- [ ] T014 Create LoopsService in `lib/services/loops.ts`
  - Implement `sendPrerequisiteReviewEmail()`
  - Implement `sendBookingRejectedEmail()`
  - Implement `getAdminEmails()` (Clerk query for role=admin)
  - Silent degradation with Rollbar logging
- [ ] T015 Update CourseService in `lib/db/admin/courses.ts`
  - Add `recommended`, `notRecommended`, `isNonPublic` to create/update

## Phase 3.4: API Layer Implementation

- [ ] T016 Create GET /api/admin/bookings/pending endpoint in `app/api/admin/bookings/pending/route.ts`
  - Query bookings where paymentStatus = PRE_BOOKED
  - Include user and course relations
  - Require admin auth
- [ ] T017 Create PATCH /api/admin/bookings/{id}/review endpoint in `app/api/admin/bookings/[id]/review/route.ts`
  - Parse action from request body (approve/reject)
  - Validate booking is PRE_BOOKED
  - Update status + reviewedAt + reviewedBy
  - Call LoopsService for rejection email
- [ ] T018 Extend PATCH /api/admin/users/{id} endpoint in `app/api/admin/users/[id]/route.ts`
  - Add isOutperformer field support
  - Validate with userUpdateSchema
- [ ] T019 Extend POST /api/payment/create-intent in `app/api/payment/create-intent/route.ts`
  - Call PrerequisiteService for INTERMEDIATE/ADVANCED courses
  - Return PRE_BOOKED status with warning if not qualified
  - Send admin notification email via LoopsService

## Phase 3.5: Frontend - Admin Components

- [ ] T020 Extend CourseForm with learning path fields in `components/admin/CourseForm.tsx`
  - Add "Empfohlen für" textarea (recommended)
  - Add "Nicht empfohlen für" textarea (notRecommended)
  - Add "Nicht-öffentlicher Kurs" checkbox (isNonPublic)
  - Follow existing Teaser field pattern
- [ ] T021 [P] Create BookingReviewPanel component in `components/admin/BookingReviewPanel.tsx`
  - Display list of PendingBooking items
  - "Genehmigen" button → onApprove callback
  - "Ablehnen" button → onReject callback
  - Loading states during API calls
- [ ] T022 Create pending bookings admin page in `app/admin/bookings/pending/page.tsx`
  - Fetch pending bookings from API
  - Render BookingReviewPanel
  - Handle approve/reject actions
  - Success/error toast notifications
- [ ] T023 [P] Create UserOutperformerToggle component in `components/admin/UserOutperformerToggle.tsx`
  - Checkbox for isOutperformer flag
  - Call PATCH /api/admin/users/{id}
  - Loading state during save

## Phase 3.6: Frontend - Public Components

- [x] T024 [P] Create CourseRecommendationSection in `components/course-detail/CourseRecommendationSection.tsx`
  - Display "Das sind passende Voraussetzungen für das Seminar" with check icon
  - Display "Das sind keine passenden Voraussetzungen für das Seminar" with warning icon
  - Only render if at least one field has value
  - MUI styling consistent with course detail page
- [x] T025 Integrate CourseRecommendationSection in `components/course-detail/CourseDetailLayout.tsx`
  - Pass recommended/notRecommended props
  - Position after curriculum section, before dates & pricing

## Phase 3.7: Course Listing Filter

- [ ] T026 Update course listing query to exclude non-public courses
  - Modify `lib/db/courses.ts` or relevant query
  - Add `WHERE isNonPublic = false` for public listings
  - Keep non-public accessible via direct slug URL

## Phase 3.8: Polish & Documentation

- [ ] T027 [P] Run quickstart.md validation scenarios manually
- [ ] T028 [P] Add Loops.so environment variable documentation to README.md
- [ ] T029 Verify all tests pass (`npm test`)
- [ ] T030 Verify Prisma types regenerated (`npx prisma generate`)

---

## Dependencies

```
T001 → T002 → T003 (Setup sequence)
T003 → T004, T005, T006 (Zod schemas need Prisma types)

T007-T012 (All tests) → T013-T019 (Implementation)

T013 (PrerequisiteService) → T019 (Payment intent uses it)
T014 (LoopsService) → T017, T019 (Review and payment use it)
T015 (CourseService) → T020 (CourseForm uses it)

T016, T017 (API) → T021, T022 (Admin UI uses API)
T024 (Section component) → T025 (Integration)

All implementation → T027-T030 (Polish)
```

## Parallel Execution Examples

### Phase 3.1 Parallel Group (after T003)
```
Task: "Create Zod schema for course learning path fields in lib/schemas/admin/course.ts"
Task: "Create Zod schema for booking review action in lib/schemas/admin/booking.ts"
Task: "Create Zod schema for user outperformer update in lib/schemas/admin/user.ts"
```

### Phase 3.2 Parallel Group (Contract Tests)
```
Task: "Contract test GET /api/admin/bookings/pending in tests/contracts/admin-booking-pending.spec.ts"
Task: "Contract test PATCH /api/admin/bookings/{id}/review in tests/contracts/admin-booking-review.spec.ts"
```

### Phase 3.2 Parallel Group (Unit Tests)
```
Task: "Unit test PrerequisiteService in tests/unit/services/prerequisite.spec.ts"
Task: "Unit test LoopsService (mocked) in tests/unit/services/loops.spec.ts"
```

### Phase 3.2 Parallel Group (Integration Tests)
```
Task: "Integration test prerequisite booking flow in tests/integration/booking-prerequisite.spec.ts"
Task: "Integration test admin review workflow in tests/integration/admin-review.spec.ts"
```

### Phase 3.5 Parallel Group (Admin UI)
```
Task: "Create BookingReviewPanel component in components/admin/BookingReviewPanel.tsx"
Task: "Create UserOutperformerToggle component in components/admin/UserOutperformerToggle.tsx"
```

### Phase 3.8 Parallel Group (Polish)
```
Task: "Run quickstart.md validation scenarios manually"
Task: "Add Loops.so environment variable documentation to README.md"
```

---

## Validation Checklist

- [x] All contracts have corresponding tests (T007, T008)
- [x] All entities have model tasks (T002)
- [x] All tests come before implementation (T007-T012 before T013-T019)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

---

## Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| 3.1 Setup | T001-T006 | T004-T006 |
| 3.2 Tests | T007-T012 | T007-T008, T009-T010, T011-T012 |
| 3.3 Services | T013-T015 | - |
| 3.4 API | T016-T019 | - |
| 3.5 Admin UI | T020-T023 | T021, T023 |
| 3.6 Public UI | T024-T025 | T024 |
| 3.7 Filter | T026 | - |
| 3.8 Polish | T027-T030 | T027-T028 |

**Total: 30 tasks** (14 parallelizable)
