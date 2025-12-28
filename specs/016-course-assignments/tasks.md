# Tasks: Course Assignments Participation Flow

**Input**: plan.md, research.md, data-model.md, quickstart.md from `specs/016-course-assignments/`  
**Prerequisites**: Follow constitution mandates (TDD, Rollbar logging, Clerk role enforcement) before implementing code  
**Available Design Docs**: plan.md · data-model.md · research.md · quickstart.md

## Task List

- [x] T001 Audit `package.json` and create `docs/development/mux-setup.md` to document Mux credentials, résumé upload limits, and update dependency list with required Mux/Vercel packages.
- [x] T002 Scaffold feature directories: `specs/016-course-assignments/contracts/`, `tests/contracts/016-course-assignments/`, `tests/integration/016-course-assignments/`, and `app/api/my-courses/[bookingId]/` with placeholder index files to unblock tests.
- [x] T003 [P] Author failing contract test for preparation GET/PUT in `tests/contracts/016-course-assignments/preparation.contract.spec.ts` covering validation and Clerk auth.
- [x] T004 [P] Author failing contract test for résumé upload/replace/delete in `tests/contracts/016-course-assignments/resume.contract.spec.ts` including single-active résumé rules and Rollbar expectations.
- [x] T005 [P] Author failing contract test for summary asset retrieval in `tests/contracts/016-course-assignments/summary.contract.spec.ts` verifying course defaults vs booking overrides.
- [x] T006 [P] Author failing contract test for debriefing endpoints in `tests/contracts/016-course-assignments/debriefing.contract.spec.ts` asserting required fields and timestamps.
- [x] T007 [P] Author failing contract test for results endpoints in `tests/contracts/016-course-assignments/results.contract.spec.ts` validating negotiation outcome persistence and audit metadata.
- [x] T008 [P] Create failing Prisma model unit test in `tests/unit/db/courseParticipation.prisma.spec.ts` ensuring CourseParticipation, ParticipationDocument, CourseSummaryAsset, and ParticipationSummaryOverride schemas exist with required relations.
- [x] T009 [P] Create failing Playwright integration test `tests/integration/016-course-assignments/participant-flow.spec.ts` that walks a participant through all steps with résumé upload and verifies persistence.
- [x] T010 [P] Create failing Playwright integration test `tests/integration/016-course-assignments/summary-visibility.spec.ts` asserting the Summary step hides when no Mux assets are returned.
- [x] T011 Extend `prisma/schema.prisma` with CourseParticipation lifecycle fields, ParticipationDocument audit metadata, summary override tables, status enums, and indexes described in data-model.md.
- [x] T012 Generate migration folder `prisma/migrations/016-course-participation/` reflecting schema additions and ensure migration passes against dev database.
- [x] T013 Update `prisma/seed.ts` (or companion seeding script) to create participation records for confirmed bookings and seed course summary assets with Mux IDs for testing.
- [x] T014 Implement data access layer in `lib/db/courseParticipation.ts` providing CRUD helpers, summary asset resolution, and résumé metadata queries using Prisma client.
- [x] T015 Create `lib/utils/resumeUpload.ts` encapsulating Vercel Blob PDF validation, single-active résumé enforcement, and Rollbar error reporting via `serverInstance`.
- [x] T016 Add server actions in `lib/actions/participation.ts` for loading and mutating preparation, summary state, debriefing, and results with Clerk authorization checks.
- [x] T017 Implement `app/api/my-courses/[bookingId]/preparation/route.ts` handling GET/PUT, zod validation, Clerk role guard, and Rollbar logging.
- [x] T018 Implement `app/api/my-courses/[bookingId]/resume/route.ts` handling POST for uploads, DELETE for removals, leveraging `resumeUpload` helper and enforcing single-active résumé semantics.
- [x] T019 Implement `app/api/my-courses/[bookingId]/summary/route.ts` returning merged course default and override assets, recording first-view timestamps, and gating empty responses.
- [x] T020 Implement `app/api/my-courses/[bookingId]/debriefing/route.ts` handling GET/PUT with schema validation, storing planned discussion data, and updating completion timestamps.
- [x] T021 Implement `app/api/my-courses/[bookingId]/results/route.ts` handling GET/PUT for negotiation outcomes, ensuring audit fields update and progress status transitions to COMPLETE.
- [x] T022 Build `components/dashboard/CourseParticipationStepper.tsx` exposing a Material-UI stepper with progress indicators sourced from server actions and hiding Summary when no assets.
- [x] T023 Build `components/dashboard/SummaryAssetList.tsx` rendering Mux playback components for provided assets with graceful fallback messaging.
- [x] T024 Build `components/dashboard/ResumeUploader.tsx` providing résumé upload/replace/delete UI wired to the new API routes with optimistic updates.
- [x] T025 Refactor `app/my-courses/page.tsx` to fetch participation data on the server, preload summary assets, and compose the new dashboard components with Clerk-protected access.
- [x] T026 Update `lib/monitoring/rollbar-official.ts` (or create dedicated helper) to register structured contexts for participation events and expose helpers consumed by UI/server actions.
- [x] T027 [P] Add Jest unit tests for `CourseParticipationStepper` in `tests/unit/components/CourseParticipationStepper.spec.tsx` covering step visibility and progress states.
- [x] T028 [P] Add Jest unit tests for server actions in `tests/unit/actions/participation.spec.ts` validating authorization, data normalization, and Rollbar logging paths.
- [x] T029 [P] Update `specs/016-course-assignments/quickstart.md` and create `docs/features/course-assignments.md` with new runbooks, summary asset seeding guidance, and manual verification steps.
- [x] T030 [P] Run `.specify/scripts/bash/update-agent-context.sh copilot` to append new technologies and recent changes in `.github/copilot-instructions.md` under the managed section.
- [x] T031 Execute full validation: `npm run lint`, `npm test`, `npx playwright test --grep "course participation"`, and document results in `docs/tests/course-assignments-validation.md`.

## Dependency Notes

- T002 depends on T001 completion to ensure dependencies are in place before scaffolding feature directories.  
- Contract and integration tests (T003–T010) must run and fail before schema or implementation tasks (T011 onward).  
- Prisma schema update (T011) unblocks migration (T012) and seeding (T013); these must finish before data layer work (T014) and API endpoints (T017–T021).  
- Server utilities (T014–T016) are prerequisites for API routes and UI integration tasks (T017–T025).  
- Observability wiring (T026) should occur after core APIs (T017–T021) to hook into final contexts.  
- Unit and documentation polish tasks (T027–T030) rely on prior implementation to reflect accurate behavior.  
- Final validation (T031) must run last after all other tasks complete.

## Parallel Execution Examples

Example: launch contract and integration test authoring in parallel once T002 is complete.

```
specify tasks run "T003 Author failing contract test for preparation GET/PUT"
specify tasks run "T004 Author failing contract test for résumé upload/replace/delete"
specify tasks run "T005 Author failing contract test for summary asset retrieval"
specify tasks run "T006 Author failing contract test for debriefing endpoints"
specify tasks run "T007 Author failing contract test for results endpoints"
specify tasks run "T009 Create failing Playwright integration test participant flow"
specify tasks run "T010 Create failing Playwright integration test summary visibility"
```

Example: polish tasks after implementation.

```
specify tasks run "T027 Add Jest unit tests for CourseParticipationStepper"
specify tasks run "T028 Add Jest unit tests for server actions"
specify tasks run "T029 Update quickstart and create course assignments docs"
specify tasks run "T030 Run update-agent-context.sh copilot"
```
