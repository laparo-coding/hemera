# Tasks: Testimonial Management

**Feature**: 017-testimonial-management  
**Date**: 2025-01-15  
**Status**: Ready for Execution

**Input**: Design documents from `/specs/017-testimonial-management/`  
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths are relative to repository root

---

## Phase 3.1: Setup & Database

- [ ] **T001** Add Testimonial model and enums to `prisma/schema.prisma`
  - Add `NameDisplayFormat` enum (FULL_NAME_CITY, FULL_NAME, FIRST_INITIAL, FIRST_NAME_ONLY)
  - Add `TestimonialStatus` enum (DRAFT, PENDING, PUBLISHED, HIDDEN)
  - Add `Testimonial` model with all fields per data-model.md
  - Add relation fields to `Booking` and `Course` models
  - Run: `npx prisma migrate dev --name add-testimonial-model`

- [ ] **T002** [P] Create Zod validation schema in `lib/schemas/testimonial.ts`
  - `createTestimonialSchema`: bookingId, statement (max 1000), nameDisplayFormat
  - `updateTestimonialSchema`: statement?, nameDisplayFormat?, status? (admin only)
  - Export TypeScript types

- [ ] **T003** [P] Create testimonial service in `lib/services/testimonialService.ts`
  - `createTestimonial(bookingId, statement, format, userId)` → compute cached fields from Clerk
  - `updateTestimonial(id, data, userId, isAdmin)` → handle edit vs approve
  - `getTestimonialsForCourse(courseId, status?)` → filter by status
  - `getTestimonialForBooking(bookingId)` → check if exists
  - `computeDisplayName(user, format, city?)` → format name per enum
  - Use Rollbar for error logging

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] **T004** [P] Contract test POST /api/testimonials in `tests/api/testimonials/create.test.ts`
  - Test: authenticated user with valid booking can create testimonial
  - Test: returns 401 for unauthenticated request
  - Test: returns 400 for invalid bookingId
  - Test: returns 409 if testimonial already exists for booking
  - Test: validates statement max 1000 chars
  - Test: validates nameDisplayFormat enum values

- [ ] **T005** [P] Contract test GET /api/testimonials in `tests/api/testimonials/list.test.ts`
  - Test: public can list PUBLISHED testimonials by courseId
  - Test: authenticated user can see own testimonials (any status)
  - Test: returns empty array for course with no testimonials
  - Test: pagination works correctly

- [ ] **T006** [P] Contract test PATCH /api/testimonials/[id] in `tests/api/testimonials/update.test.ts`
  - Test: owner can update statement and format
  - Test: admin can change status to PUBLISHED
  - Test: admin can change status to HIDDEN
  - Test: non-owner returns 403
  - Test: non-admin cannot change status

- [ ] **T007** [P] Integration test participant flow in `tests/e2e/testimonials-participant.spec.ts`
  - Sign in as participant with confirmed booking
  - Navigate to my-courses/[slug]
  - Fill testimonial form with statement
  - Select name format option
  - Verify preview matches expected display
  - Submit and verify success message
  - Verify status is PENDING in database

- [ ] **T008** [P] Integration test admin approval in `tests/e2e/testimonials-admin.spec.ts`
  - Sign in as admin
  - Navigate to /admin/testimonials
  - Verify pending testimonial appears in list
  - Click approve button
  - Verify status changes to PUBLISHED
  - Navigate to course detail page
  - Verify testimonial is visible

---

## Phase 3.3: API Implementation (ONLY after tests are failing)

- [ ] **T009** Create API route GET/POST in `app/api/testimonials/route.ts`
  - GET: List testimonials filtered by courseId, userId, status
  - POST: Create new testimonial (auth required)
  - Use testimonialService for business logic
  - Apply Zod validation
  - Return proper error responses with Rollbar logging

- [ ] **T010** Create API route GET/PATCH/DELETE in `app/api/testimonials/[id]/route.ts`
  - GET: Fetch single testimonial (public if PUBLISHED, auth for own)
  - PATCH: Update testimonial (owner for content, admin for status)
  - DELETE: Soft-delete via HIDDEN status (admin only)
  - Check authorization properly

- [ ] **T011** Create server actions in `lib/actions/testimonials.ts`
  - `submitTestimonial(formData)` → create with PENDING status
  - `updateTestimonial(id, formData)` → edit statement/format
  - `approveTestimonial(id)` → set status PUBLISHED (admin)
  - `hideTestimonial(id)` → set status HIDDEN (admin)
  - Revalidate paths after mutations

---

## Phase 3.4: Frontend Components

- [ ] **T012** [P] Create TestimonialCard component in `components/testimonials/TestimonialCard.tsx`
  - Display profile photo (Avatar with fallback to initials)
  - Display formatted name per nameDisplayFormat
  - Display statement text
  - Responsive layout matching course detail page design
  - Props: `testimonial: Testimonial`

- [ ] **T013** [P] Create TestimonialForm component in `components/testimonials/TestimonialForm.tsx`
  - Text input for statement (max 1000 chars with counter)
  - Radio/Select for name display format (hide option A if no city)
  - Live preview using TestimonialCard
  - Submit button with loading state
  - Edit mode: pre-fill existing values
  - Uses server action for submission
  - German labels: "Deine Erfahrung teilen", "Wie soll dein Name angezeigt werden?"

- [ ] **T014** Create TestimonialSection component in `components/testimonials/TestimonialSection.tsx`
  - Fetch published testimonials for course
  - Render list of TestimonialCard components
  - Empty state if no testimonials
  - Section title: "Was Teilnehmer sagen"
  - Lazy load for performance

- [ ] **T015** Create TestimonialAdminList component in `components/testimonials/TestimonialAdminList.tsx`
  - Table/List of pending testimonials
  - Show: participant name, course title, statement preview, date
  - Action buttons: Freigeben (approve), Ausblenden (hide)
  - Filter by status (PENDING, PUBLISHED, HIDDEN)
  - Uses server actions for mutations

---

## Phase 3.5: Page Integration

- [ ] **T016** Add TestimonialSection to course detail page `app/courses/[slug]/page.tsx`
  - Import TestimonialSection component
  - Place beneath "Termin und Preis" section
  - Pass courseId to component
  - SSR for initial testimonials (performance)

- [ ] **T017** Add TestimonialForm to participant dashboard `app/my-courses/[slug]/page.tsx`
  - Check if user has confirmed booking for course
  - Fetch existing testimonial if any
  - Render TestimonialForm (create or edit mode)
  - Show success/pending status after submission

- [ ] **T018** Create admin testimonials page `app/admin/testimonials/page.tsx`
  - Admin role check via Clerk
  - Render TestimonialAdminList component
  - Page title: "Testimonials verwalten"
  - Breadcrumb navigation

---

## Phase 3.6: Polish & Validation

- [ ] **T019** [P] Unit tests for testimonialService in `tests/unit/testimonialService.test.ts`
  - Test computeDisplayName for all 4 formats
  - Test format A fallback when city missing
  - Test validation of statement length
  - Test duplicate testimonial prevention

- [ ] **T020** [P] Unit tests for TestimonialForm in `tests/unit/TestimonialForm.test.tsx`
  - Test character counter updates
  - Test format option hiding when no city
  - Test preview updates on input change
  - Test form submission

- [ ] **T021** Run E2E tests and verify quickstart.md steps
  - Execute all validation steps from quickstart.md
  - Verify all acceptance scenarios pass
  - Check Lighthouse performance (FCP < 1.8s, LCP < 2.5s)

- [ ] **T022** [P] Update documentation
  - Add testimonial API to `docs/api/` if exists
  - Update feature changelog

---

## Dependencies Graph

```
T001 (schema) ──┬──► T002 (zod) ──► T009, T010 (API)
                │
                └──► T003 (service) ──► T009, T010, T011 (API/actions)

T004-T008 (tests) ──► T009-T011 (API) ──► T012-T015 (components)
                                                │
                                                ▼
                                          T016-T018 (pages)
                                                │
                                                ▼
                                          T019-T022 (polish)
```

## Parallel Execution Groups

### Group 1: Schema & Foundation (sequential)
```bash
# Run T001 first (blocks everything)
Task: "Add Testimonial model and enums to prisma/schema.prisma"
```

### Group 2: Validation & Service (parallel after T001)
```bash
# Launch T002, T003 together:
Task: "Create Zod validation schema in lib/schemas/testimonial.ts"
Task: "Create testimonial service in lib/services/testimonialService.ts"
```

### Group 3: Contract Tests (parallel after T002, T003)
```bash
# Launch T004-T006 together:
Task: "Contract test POST /api/testimonials in tests/api/testimonials/create.test.ts"
Task: "Contract test GET /api/testimonials in tests/api/testimonials/list.test.ts"
Task: "Contract test PATCH /api/testimonials/[id] in tests/api/testimonials/update.test.ts"
```

### Group 4: E2E Tests (parallel with Group 3)
```bash
# Launch T007, T008 together:
Task: "Integration test participant flow in tests/e2e/testimonials-participant.spec.ts"
Task: "Integration test admin approval in tests/e2e/testimonials-admin.spec.ts"
```

### Group 5: API Routes (sequential after tests)
```bash
# Run T009, T010, T011 sequentially (shared dependencies)
Task: "Create API route GET/POST in app/api/testimonials/route.ts"
Task: "Create API route GET/PATCH/DELETE in app/api/testimonials/[id]/route.ts"
Task: "Create server actions in lib/actions/testimonials.ts"
```

### Group 6: Components (parallel after API)
```bash
# Launch T012, T013 together:
Task: "Create TestimonialCard component in components/testimonials/TestimonialCard.tsx"
Task: "Create TestimonialForm component in components/testimonials/TestimonialForm.tsx"

# Then T014, T015 together:
Task: "Create TestimonialSection component in components/testimonials/TestimonialSection.tsx"
Task: "Create TestimonialAdminList component in components/testimonials/TestimonialAdminList.tsx"
```

### Group 7: Pages (sequential after components)
```bash
# Run T016, T017, T018 sequentially
Task: "Add TestimonialSection to course detail page app/courses/[slug]/page.tsx"
Task: "Add TestimonialForm to participant dashboard app/my-courses/[slug]/page.tsx"
Task: "Create admin testimonials page app/admin/testimonials/page.tsx"
```

### Group 8: Polish (parallel at end)
```bash
# Launch T019, T020, T022 together:
Task: "Unit tests for testimonialService in tests/unit/testimonialService.test.ts"
Task: "Unit tests for TestimonialForm in tests/unit/TestimonialForm.test.tsx"
Task: "Update documentation"

# Then T021 last (full validation):
Task: "Run E2E tests and verify quickstart.md steps"
```

---

## Estimated Effort

| Phase | Tasks | Parallel Groups | Est. Time |
|-------|-------|-----------------|-----------|
| Setup | T001-T003 | 2 | 1-2h |
| Tests | T004-T008 | 2 | 2-3h |
| API | T009-T011 | 1 | 2-3h |
| Components | T012-T015 | 2 | 3-4h |
| Pages | T016-T018 | 1 | 2h |
| Polish | T019-T022 | 2 | 2h |
| **Total** | **22 tasks** | **10 groups** | **~12-16h** |
