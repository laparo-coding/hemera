# Tasks: User Course Management (Spec 027)

**Input**: Design documents from `/specs/027-user-course-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md, quickstart.md

**Legend**: `[P]` = Prerequisite task (other tasks depend on this)

> **TDD Compliance (Constitution §I):** Every new component and server action MUST follow
> the Red-Green-Refactor cycle. Write a failing contract/unit test first, then implement
> the minimal code to pass, then refactor. This applies to all tasks creating new files
> (T004–T006, T011, T014, T016) and modifying existing components (T007, T009, T010, T012, T018).

## User Story Mapping

| Story | Source | Description |
|-------|--------|-------------|
| US1 | Core Spec | Dashboard Progress Stepper — 4-step horizontal MUI Stepper per booking |
| US2 | Amendment B | Preparation Substeps — break Vorbereitung into 4 individual substeps + Zusammenfassung on detail page |
| US3 | Amendment C | Testimonial Flyout — move testimonial to dashboard MUI Drawer |
| US4 | Amendment D | Nachbereitung Video Catalog — dedicated page with MuxPlayer grid |
| US5 | Amendment E | Verhandlungsergebnis Form — dedicated page with DatePicker, card selector, textarea |
| US6 | Core Spec | Detail Page Cleanup — remove moved sections from course detail page |

---

## Phase 1: Setup

- [X] T001 Add `resultDate DateTime?` and `resultNegotiationPartner String?` fields with `@map` annotations to `CourseParticipation` model in `prisma/schema.prisma` and run migration `add_result_date_and_negotiation_partner`
- [X] T002 [P] Verify `@mui/x-date-pickers` and date-fns adapter (`@mui/x-date-pickers/AdapterDateFns`) availability in `package.json`; install missing dependencies if needed

## Phase 2: Foundational

- [X] T003 [P] Extend dashboard data fetching to include `participationStatus: ParticipationStatus | null` for each booking in the dashboard API response (data source: `lib/api/` or `app/api/dashboard/` — locate existing fetch logic)
- [X] T004 [P] Add `saveNegotiationResult()` and `loadNegotiationResult()` helpers for `resultDate`, `resultNegotiationPartner`, and the existing `resultOutcome` field in `lib/db/courseParticipation.ts`
- [X] T005 Add `saveNegotiationResultAction` server action calling the DB helper in `lib/actions/participation.ts` with validation: `resultDate` not in future, `resultNegotiationPartner` one of `DIRECT_MANAGER | SKIP_LEVEL_MANAGER | HR_DEPARTMENT`, `resultOutcome` max 2000 chars

## Phase 3: US1 — Dashboard Progress Stepper

**Goal**: Display a 4-step horizontal MUI Stepper (Vorbereitung Seminar → Seminarveranstaltung → Nachbereitung Seminar → Verhandlungsergebnis) per booking on the dashboard. All steps are clickable (no locking during testing phase). Step states derived from `participationStatus`.

- [X] T006 [P] [US1] Create `CourseProgressStepper` client component with 4-step horizontal `<Stepper>`, custom `StepIconComponent` (CheckCircle/RadioButtonChecked/Lock icons), step labels "Vorbereitung Seminar", "Seminarveranstaltung", "Nachbereitung Seminar", "Verhandlungsergebnis", heading "Dein Fortschritt", and navigation links per step in `components/dashboard/CourseProgressStepper.tsx` (contract: `ui-contracts.md` §1)
- [X] T007 [US1] Remove `#nachbereitung` and `#ergebnisse` deep-link action buttons and add `participationStatus` prop to `components/dashboard/CourseCard.tsx`
- [X] T008 [US1] Integrate `CourseProgressStepper` per booking within existing dashboard sections ("Nächstes Seminar", "Abgeschlossene Seminare") and pass `participationStatus` from dashboard data in `components/UserDashboard.tsx`

**Independent test criteria**: Dashboard shows a 4-step stepper per booking with correct visual states; clicking any step navigates to the correct URL; no deep-link buttons remain on CourseCard.

## Phase 4: US2 — Preparation Substeps

**Goal**: Replace the single "Vorbereitung" step on the detail page with 4 individual substeps (Seminar-Absicht, Erwartete Ergebnisse, Dein Vorgesetzter, Lebenslauf) + Zusammenfassung. Each substep shows only its own field. Rename "Vorbereitung" → "Vorbereitung Seminar".

- [X] T009 [US2] Modify `CourseParticipationStepper` from 4-step to 5-step variant: replace `allSteps` with `[PREP_INTENT: "Seminar-Absicht", PREP_RESULTS: "Erwartete Ergebnisse", PREP_MANAGER: "Dein Vorgesetzter", PREP_RESUME: "Lebenslauf", SUMMARY: "Zusammenfassung"]`; adjust `getStepIndex()` derivation using field-null checks (`null` = not visited, `""` = skipped, value = completed) in `components/participation/CourseParticipationStepper.tsx`
- [X] T010 [US2] Refactor `PreparationSection` to render only the active substep's field with "Weiter" button (saves field value, even empty string on skip) and "Überspringen" option; rename section heading → "Vorbereitung Seminar" and CTA → "Vorbereitung Seminar starten" in `app/my-courses/[bookingId]/PreparationSection.tsx`

**Independent test criteria**: Detail page stepper shows 5 numbered steps; each substep displays only its own field; "Weiter" advances to next substep and persists value; returning resumes at correct substep; heading reads "Vorbereitung Seminar".

## Phase 5: US3 — Testimonial Flyout

**Goal**: Move testimonial from course detail page to a right-anchored MUI Drawer opened via "Erfahrungsbericht" button on dashboard CourseCard.

- [X] T011 [P] [US3] Create `TestimonialDrawer` client component: MUI `<Drawer anchor="right">` with responsive width (`xs: 100%`, `sm: 400px`), header "Erfahrungsbericht" with close button, embedding existing `TestimonialForm` component, read-mode with "Bearbeiten" for existing testimonials, onClose on backdrop/X/success in `components/dashboard/TestimonialDrawer.tsx` (contract: `ui-contracts.md` §2)
- [X] T012 [US3] Add "Erfahrungsbericht" outlined button with `RateReview` icon (visible for `COMPLETED` section type only), `courseName`, and `userProfile` props to `components/dashboard/CourseCard.tsx`; wire button click to toggle `TestimonialDrawer` open state
- [X] T013 [US3] Pass `userProfile` data (`firstName`, `lastName`, `imageUrl`, `city`) from Clerk user context to each `CourseCard` in `components/UserDashboard.tsx`

**Independent test criteria**: "Erfahrungsbericht" button visible on course cards; clicking opens right drawer with testimonial form; existing testimonial shows in read mode; drawer closes on submit/backdrop/X.

## Phase 6: US4 — Nachbereitung Video Catalog

**Goal**: Create a dedicated page at `/my-courses/[bookingId]/nachbereitung` displaying a video catalog grid with MuxPlayer cards. Dashboard stepper links to this page.

- [X] T014 [P] [US4] Create `DebriefingVideoCatalog` client component: CSS Grid (2 cols `md+`, 1 col `xs/sm`), `Paper` cards with dynamic-imported `MuxPlayer` (`ssr: false`, `accentColor={colors.bronze}`, 16:9), title, duration, "✓ Angesehen" badge, empty state `Alert` ("Deine Videos werden nach dem Seminar hier bereitgestellt."), "Zurück zum Dashboard" back link in `components/participation/DebriefingVideoCatalog.tsx` (contract: `ui-contracts.md` §3)
- [X] T015 [US4] Create `nachbereitung` server component route page: load booking context via `requireAuthenticatedUser()`, fetch resolved video assets via existing `getResolvedSummaryAssets`, render page heading "Nachbereitung Seminar" with course title subtitle, embed `DebriefingVideoCatalog` in `app/my-courses/[bookingId]/nachbereitung/page.tsx`

**Independent test criteria**: `/my-courses/[bookingId]/nachbereitung` displays video catalog grid; videos are playable inline; empty state shown when no videos; back link navigates to `/dashboard`.

## Phase 7: US5 — Verhandlungsergebnis Form

**Goal**: Create a dedicated page at `/my-courses/[bookingId]/verhandlungsergebnis` with a 3-field form (DatePicker, card-based partner selector, textarea) that persists to the 2 new Prisma fields + existing `resultOutcome`. Dashboard stepper links to this page.

- [X] T016 [P] [US5] Create `NegotiationResultForm` client component: `StaticDatePicker` with `de` locale for `resultDate`, card-based `NegotiationPartnerSelector` (3 options: DIRECT_MANAGER, SKIP_LEVEL_MANAGER, HR_DEPARTMENT with selected state `border: colors.marsala`, `bgcolor: colors.beige`), multiline textarea for `resultOutcome`, "Verhandlungsergebnis speichern" submit button, "Zurück zum Dashboard" back link, partial save pattern in `components/participation/NegotiationResultForm.tsx` (contract: `ui-contracts.md` §4)
- [X] T017 [US5] Create `verhandlungsergebnis` server component route page: load booking context and existing result values, render page heading "Verhandlungsergebnis" with course title subtitle, embed `NegotiationResultForm` with `initialValues` and `saveNegotiationResultAction` in `app/my-courses/[bookingId]/verhandlungsergebnis/page.tsx`

**Independent test criteria**: `/my-courses/[bookingId]/verhandlungsergebnis` displays DatePicker calendar, 3 choice cards, textarea; form saves successfully; returning shows persisted values; back link navigates to `/dashboard`.

## Phase 8: US6 — Detail Page Cleanup

**Goal**: Remove sections that have been relocated to dashboard/dedicated pages.

- [X] T018 [US6] Remove `<DebriefingSection />`, `<ResultsSection />`, and `<TestimonialSectionMyCourses />` rendering (imports + JSX) from `app/my-courses/[bookingId]/page.tsx`; keep source files for potential reuse

**Independent test criteria**: `/my-courses/[bookingId]` shows only Preparation substeps and Zusammenfassung; no Nachbereitung, Ergebnis, or Testimonial sections visible.

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T019 [P] Apply label renames in legacy files retained for possible reuse: "Nachbereitung" → "Nachbereitung Seminar" in `app/my-courses/[bookingId]/DebriefingSection.tsx`; "Teilnahme bestätigt" / "Ergebnis" → "Verhandlungsergebnis" in `app/my-courses/[bookingId]/ResultsSection.tsx`
- [X] T020 Run full verification per `specs/027-user-course-management/quickstart.md` sections 1–6 (Dashboard Stepper, Preparation Substeps, Testimonial Drawer, Nachbereitung Page, Verhandlungsergebnis Page, Detail Page Cleanup)

---

## Dependencies

```
T001 (Prisma migration) ──┬──→ T004 (DB helpers) ──→ T005 (server action)
                          │
T002 (deps check) ────────┘

T003 (dashboard API) ──→ T006 (stepper) ──┐
                         T007 (card)  ────┤──→ T008 (dashboard integration)
                                          │
T009 (stepper 5-step) ──→ T010 (substep UI)
                                          │
T011 (drawer) ──→ T012 (card button) ──→ T013 (userProfile wiring)
                                          │
T014 (video catalog) ──→ T015 (nachbereitung page)
                                          │
T004 → T005 → T016 (result form) ──→ T017 (verhandlungsergebnis page)
                                          │
T013, T015, T017 ──→ T018 (detail page cleanup) ──→ T019 (label renames)
                                                       │
T019 ──→ T020 (verification)
```

## Parallel Execution Examples

### Parallel Group A (after T001 + T002)
```
T003 — Extend dashboard API with participationStatus
T004 — Add DB helpers for result fields
```

### Parallel Group B (after Phase 2 complete)
```
T006 — CourseProgressStepper (new component)
T011 — TestimonialDrawer (new component)
T014 — DebriefingVideoCatalog (new component)
T016 — NegotiationResultForm (new component)
```

### Parallel Group C (after Group B components; dependency chains within)
```
T009 — CourseParticipationStepper 5-step (components/participation/)
T015 — nachbereitung page (depends on T014)
T017 — verhandlungsergebnis page (depends on T016)
```

## Implementation Strategy

1. **MVP (US1 + US6)**: Dashboard stepper + detail page cleanup. This delivers the core UX improvement — users see their progress on the dashboard.
2. **Increment 1 (US2)**: Preparation substeps. Improves the Vorbereitung experience independently.
3. **Increment 2 (US3)**: Testimonial flyout. Increases testimonial discoverability.
4. **Increment 3 (US4 + US5)**: Nachbereitung + Verhandlungsergebnis pages. Completes the full participation flow.
5. **Finalize (Polish)**: Label renames, verification.

## Notes

- **Testing phase**: All stepper steps are always clickable — no locking logic. Lock visuals and prerequisite checks deferred to post-testing.
- **Substep persistence**: Derived from field values (`null` = not visited, `""` = skipped, value = completed). No new DB column needed.
- **Partial save**: All form fields optional. Users can fill any subset and return later.
- **Existing API reuse**: `GET /api/my-courses/[bookingId]/summary` provides video assets for nachbereitung page. No new API endpoints.
- **No admin-side changes**: This spec is purely user-facing.

## Deferred Tasks

- [ ] **T021** — Stepper locking logic (post-testing): Implement visual lock icons and prerequisite checks for stepper steps (Nachbereitung locked until SUMMARY, Verhandlungsergebnis locked until DEBRIEFING). Deferred to post-testing phase per spec acceptance criteria.
