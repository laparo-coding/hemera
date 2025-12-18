# Phase 2 Tasks — Course Admin Interface

Conventions
- [P]: Task can run in parallel
- Dependencies: Use `T###` identifiers
- Paths: Use repo-relative paths
- Commands: Use existing npm scripts where possible

## Foundation

[X] T001 — Add dependencies [P]
- Paths: `package.json`
- Actions:
  - Add `@vercel/blob` and `react-hook-form` to `dependencies`
- Commands: `npm install @vercel/blob react-hook-form`
- Acceptance: Packages added; lockfile updated; build passes

[X] T002 — Configure env for Blob [P]
- Paths: `.env.local`, `lib/env.ts`
- Actions:
  - Add `BLOB_READ_WRITE_TOKEN` and any required Blob config
  - Export typed accessors in `lib/env.ts`
- Acceptance: `lib/env.ts` exposes token; `npm run build` reads env without errors

[X] T003 — Zod schema for Course [P]
- Paths: `lib/schemas/admin/course.ts`
- Actions:
  - Implement Zod schema: title, description, price, startTime, duration, instructor, level, thumbnailUrl, capacity
  - Export input/output types
- Acceptance: Unit import works; schema validates constraints from `research.md`

[X] T004 — Admin types [P]
- Paths: `lib/types/admin.ts`
- Actions:
  - Define DTOs: `CourseCreateInput`, `CourseUpdateInput`, `CourseWithEnrollmentCount`
- Acceptance: Types compile and align with Prisma model

[X] T005 — Contract test scaffolding [P]
- Paths: `tests/contracts/admin/courses.spec.ts`
- Actions:
  - Create failing tests per `contracts/api-contract.md` (LIST, GET, CREATE, PATCH, DELETE, TRANSFER)
  - Include auth tests (403 for non-admin)
- Commands: `npm run test:contracts`
- Acceptance: Tests exist and fail (red) before implementation

## Database & Migrations

[X] T006 — Prisma schema update (Course fields)
- Paths: `prisma/schema.prisma`
- Actions:
  - Add fields: `startTime`, `capacity`, `thumbnailUrl`, `level enum`
  - Add index on `startTime`
- Commands: `npm run db:migrate`
- Dependencies: T003
- Acceptance: Migration generated and applied; Prisma types updated

[X] T007 — Backfill script for existing courses
- Paths: `scripts/backfill-course-admin-fields.ts`
- Actions:
  - Set default `startTime = now()+30d` and `capacity = 20` for existing rows
- Commands: `node scripts/backfill-course-admin-fields.ts`
- Dependencies: T006
- Acceptance: Existing courses populated safely; idempotent script

## Data Layer & Server Actions

[X] T008 — Prisma admin queries
- Paths: `lib/db/admin/courses.ts`
- Actions:
  - Implement `listCourses(orderBy startTime asc, include _count)`
  - Implement `getCourseById(with enrollment count)`
  - Implement `createCourse`, `updateCourse (optimistic lock)`, `deleteCourse`, `transferEnrollments`
- Dependencies: T006, T004
- Acceptance: Unit stubs compile; no runtime yet

[X] T009 — Server actions for admin CRUD
- Paths: `lib/actions/admin/courses.ts`
- Actions:
  - `use server` functions wrapping `lib/db/admin` with Zod validation
  - Call `revalidatePath('/admin')` after mutations
  - Rollbar logging on error/success
- Dependencies: T003, T008
- Acceptance: Actions compile; unit tests to be added in T015

[X] T010 — Error handling wrappers usage [P]
- Paths: `lib/middleware/server-action-error-handling.ts`
- Actions:
  - Integrate server action error handling helpers
- Dependencies: T009
- Acceptance: Actions use standardized error paths; no `console.error`

## API Routes

[X] T011 — Route: List + Create
- Paths: `app/api/admin/courses/route.ts`
- Actions:
  - GET: list courses (sorted); admin auth guard; Rollbar on DB errors
  - POST: create with Zod validation; return 201
- Dependencies: T008, T003, T014
- Acceptance: Contract tests for LIST/CREATE pass after implementation

[X] T012 — Route: Get + Patch + Delete
- Paths: `app/api/admin/courses/[id]/route.ts`
- Actions:
  - GET: course by id (+enrollment count)
  - PATCH: optimistic locking via `updatedAt`
  - DELETE: block when active enrollments > 0
- Dependencies: T008, T003, T014
- Acceptance: Contract tests for GET/PATCH/DELETE pass

[X] T013 — Route: Transfer Enrollments
- Paths: `app/api/admin/courses/[id]/transfer-enrollments/route.ts`
- Actions:
  - POST: validate target course, capacity, and perform `updateMany`
- Dependencies: T008, T003, T014
- Acceptance: Contract tests for TRANSFER pass

## Auth & Middleware

[X] T014 — Admin role check helper
- Paths: `lib/auth/permissions.ts`
- Actions:
  - Add `isAdmin(sessionClaims)` helper; export for API/pages
- Acceptance: Unit test validates `publicMetadata.role === 'admin'`

[X] T015 — Server action unit tests [P]
- Paths: `tests/unit/lib/actions/admin/courses.spec.ts`
- Actions:
  - Mock `lib/db/admin` and `Clerk` claims; test validation, optimistic lock, Rollbar calls
- Dependencies: T009, T014
- Commands: `npm run test:unit`
- Acceptance: Unit tests cover success and error paths; pass after implementation

## UI Components

T016 — File upload utility [P]
- Paths: `lib/utils/fileUpload.ts`
- Actions:
  - Implement `uploadThumbnail(file)` via `@vercel/blob`; validate type/size
- Dependencies: T001, T002
- Acceptance: Returns Blob URL; errors go through Rollbar

T017 — CourseForm component [P]
- Paths: `components/admin/CourseForm.tsx`
- Actions:
  - React Hook Form + Zod resolver; fields per schema; integrates `FileUpload`
- Dependencies: T003, T016
- Acceptance: Client-side validation works; ready to wire actions

T018 — CourseList component [P]
- Paths: `components/admin/CourseList.tsx`
- Actions:
  - MUI table with sort by `startTime`; shows `_count.enrollments`
- Dependencies: T008
- Acceptance: Renders list from server data; pagination-ready

T019 — DeleteConfirmation component [P]
- Paths: `components/admin/DeleteConfirmation.tsx`
- Actions:
  - Modal enforcing enrollment check; disables delete when count > 0; shows transfer CTA
- Dependencies: T008
- Acceptance: UI reflects delete policy

T020 — CourseCard component [P]
- Paths: `components/admin/CourseCard.tsx`
- Actions:
  - Thumbnail, title, level, startTime; edit/delete actions
- Dependencies: T017, T018
- Acceptance: Renders consistent with design system (MUI)

## Pages & Layout

T021 — Admin layout with guard
- Paths: `app/admin/layout.tsx`
- Actions:
  - Check Clerk session; redirect non-admin to `/dashboard`; wrap children
- Dependencies: T014
- Acceptance: Navigating to `/admin` requires admin role

T022 — Admin index page
- Paths: `app/admin/page.tsx`
- Actions:
  - Server component fetching list; renders `CourseList`; "Create New" button
- Dependencies: T018
- Acceptance: Sorted list by `startTime`; empty state handled

T023 — Create course page
- Paths: `app/admin/courses/new/page.tsx`
- Actions:
  - Render `CourseForm`; on submit calls server action
- Dependencies: T017, T009
- Acceptance: Successful create → revalidate and redirect

T024 — Edit course page
- Paths: `app/admin/courses/[id]/edit/page.tsx`
- Actions:
  - Preload existing course; include hidden `updatedAt` for optimistic lock; use `CourseForm`
- Dependencies: T017, T009, T008
- Acceptance: Updates persist; conflict shows error UI

T025 — Delete course page
- Paths: `app/admin/courses/[id]/delete/page.tsx`
- Actions:
  - Show `DeleteConfirmation`; call delete action; cleanup Blob on success
- Dependencies: T019, T009, T016
- Acceptance: Blocks when enrollments exist; deletes when 0; cleans Blob

## Integration & E2E

T026 — Contract tests to green
- Paths: `tests/contracts/admin/courses.spec.ts`
- Actions:
  - Implement against real routes; satisfy schemas and error codes
- Dependencies: T011, T012, T013
- Commands: `npm run test:contracts`
- Acceptance: All contract tests pass

T027 — E2E: Create course
- Paths: `tests/e2e/admin/create-course.spec.ts`
- Actions:
  - Playwright: sign-in, `/admin`, create flow incl. upload
- Dependencies: T021–T023, T016
- Commands: `npm run test:e2e`
- Acceptance: Test passes in CI-headed mode

T028 — E2E: Edit + optimistic lock
- Paths: `tests/e2e/admin/edit-course.spec.ts`
- Actions:
  - Two-tab scenario; verify 409 path and UX message
- Dependencies: T024
- Commands: `npm run test:e2e`
- Acceptance: Test passes; conflict handled gracefully

T029 — E2E: Delete protection
- Paths: `tests/e2e/admin/delete-course.spec.ts`
- Actions:
  - Create enrollment (fixture); verify block; transfer then delete
- Dependencies: T025, T013
- Commands: `npm run test:e2e`
- Acceptance: Protection works; transfer enables deletion

## Observability & Policies

T030 — Rollbar structured logging
- Paths: `lib/monitoring/rollbar-official.ts`, call sites in actions/routes
- Actions:
  - Log `info` on success, `warning` on blocked deletion, `error/critical` on failures
- Dependencies: T009, T011–T013
- Acceptance: Rollbar dashboard shows contextual events

T031 — Performance checks [P]
- Paths: `docs/performance/README.md`
- Actions:
  - Measure LIST endpoint (<100ms), page load (<2s); adjust queries/caching if needed
- Dependencies: T011–T022
- Acceptance: Meets budgets; document findings

T032 — Quickstart validation & cleanup
- Paths: `specs/014-create-an-admin/quickstart.md`
- Actions:
  - Execute all steps; remove test data; verify Blob cleanup
- Dependencies: T021–T025
- Acceptance: Checklist fully ticked; no orphaned data

## Parallelization Guide
- [P] Eligible: T001–T005, T010, T016–T020, T031
- Sequential Chains:
  - DB: T006 → T007 → T008
  - Backend: T008 → T009 → T011–T013 → T026
  - Frontend: T017–T020 → T021–T025
  - E2E: T021–T025 → T027–T029

## Notes
- Use `lib/middleware/api-error-handling.ts` and `server-action-error-handling.ts` for standardized responses.
- Enforce no `console.error`; use Rollbar for all error reporting.
- Respect `package.json` test script paths: `tests/contracts` folder.
