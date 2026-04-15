# Implementation Plan: User Course Management (Spec 027)

**Branch**: `027-user-course-management` | **Date**: 2026-04-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/027-user-course-management/spec.md`

## Execution Flow (/plan command scope)

```
1. ✅ Load feature spec from specs/027-user-course-management/spec.md
2. ✅ Fill Technical Context (no NEEDS CLARIFICATION — project well-understood)
3. ✅ Fill Constitution Check section
4. ✅ Evaluate Constitution Check — no violations
5. ✅ Execute Phase 0 → research.md
6. ✅ Execute Phase 1 → data-model.md, contracts/, quickstart.md
7. ✅ Re-evaluate Constitution Check — passes
8. Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary

Restructure the user-facing course participation flow by moving Nachbereitung and Ergebnis phases
from the course detail page to the dashboard. Introduce a 4-step horizontal progress stepper
(Vorbereitung Seminar → Seminarveranstaltung → Nachbereitung Seminar → Verhandlungsergebnis) on the dashboard. Break
Vorbereitung into 4 individual substeps on the detail page. Move Testimonials into a dashboard
flyout drawer. Create dedicated pages for Nachbereitung (video catalog) and Verhandlungsergebnis
(form with DatePicker, choice cards, textarea). Add two Prisma fields (`resultDate`,
`resultNegotiationPartner`) to the `CourseParticipation` model.

## Technical Context

**Language/Version**: TypeScript 5.9 with Next.js 16.2.3 (App Router) + React 19.2.5
**Primary Dependencies**: Material-UI 7.3.4, Clerk auth, Prisma ORM 7.7.0, Mux Player, @mui/x-date-pickers
**Storage**: PostgreSQL via Prisma (existing `CourseParticipation` model — 2 new fields)
**Testing**: Jest (unit/contract), Playwright (E2E)
**Target Platform**: Vercel (web, SSR + client)
**Project Type**: web (Next.js monolith — app/ + lib/ + components/)
**Performance Goals**: FCP < 1.8s, LCP < 2.5s, CLS < 0.1 (Lighthouse CI budgets)
**Constraints**: Informal German ("Du"), existing design token system, no admin-side changes
**Scale/Scope**: ~15 files changed/created, 2 new routes, 1 Prisma migration, 0 new API route handlers (uses server actions instead)

> Latest stable versions checked on 2026-04-13: Next.js 16.2.3, React 19.2.5,
> Material UI 9.0.0, Prisma 7.7.0. This feature plan documents the versions actually
> used in this repository, not the latest available major for every dependency.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| I. Test-First Development | ✅ PASS | Unit tests for new components; contract tests for stepper logic |
| II. Code Quality & Formatting | ✅ PASS | All new code through Biome lint/format; TypeScript strict mode |
| III. Feature Development Workflow | ✅ PASS | Spec-first approach followed; Prisma migration for 2 new fields |
| IV. Authentication & Security | ✅ PASS | All pages use `requireAuthenticatedUser()`; booking ownership check preserved |
| V. Component Architecture | ✅ PASS | MUI components; design tokens; accessible stepper with ARIA states |
| VI. Holistic Error Handling | ✅ PASS | Rollbar for API/server errors; Error Boundaries on client components |
| VII. Stripe Integration | ✅ N/A | No payment flow changes |
| Deployment Standards | ✅ PASS | GitHub Actions only; PR → preview → merge → production |
| German Localization | ✅ PASS | All labels in informal German |

**No violations. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```
specs/027-user-course-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ui-contracts.md  # Component interfaces & stepper contracts
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
app/
├── my-courses/
│   └── [bookingId]/
│       ├── page.tsx                         # MODIFY — remove imports/usage of DebriefingSection, ResultsSection, TestimonialSection
│       ├── PreparationSection.tsx            # MODIFY — substep breakdown, rename label
│       ├── DebriefingSection.tsx             # KEEP (reuse on nachbereitung page)
│       ├── ResultsSection.tsx                # KEEP (reference for new form)
│       ├── TestimonialSectionMyCourses.tsx   # KEEP (logic reuse in drawer)
│       ├── nachbereitung/
│       │   └── page.tsx                     # NEW — video catalog server component
│       └── verhandlungsergebnis/
│           └── page.tsx                     # NEW — result form server component

components/
├── dashboard/
│   ├── CourseCard.tsx                       # MODIFY — remove deep-links, add Erfahrungsbericht button
│   ├── CourseProgressStepper.tsx            # NEW — 4-step horizontal dashboard stepper
│   └── TestimonialDrawer.tsx               # NEW — MUI Drawer wrapping TestimonialForm
├── participation/
│   ├── CourseParticipationStepper.tsx       # MODIFY — 5-step substep variant (4 preparation substeps + Zusammenfassung)
│   ├── DebriefingVideoCatalog.tsx           # NEW — video catalog grid
│   └── NegotiationResultForm.tsx            # NEW — date + choice + textarea form
├── UserDashboard.tsx                        # MODIFY — integrate stepper, pass userProfile

lib/
├── db/
│   └── courseParticipation.ts               # MODIFY — add save/load for resultDate, resultNegotiationPartner
└── actions/
    └── participation.ts                     # MODIFY — add result form save action

prisma/
└── schema.prisma                            # MODIFY — add 2 fields to CourseParticipation

tests/
├── unit/
│   ├── components/dashboard/CourseProgressStepper.spec.tsx
│   ├── components/dashboard/TestimonialDrawer.spec.tsx
│   ├── components/participation/DebriefingVideoCatalog.spec.tsx
│   └── components/participation/NegotiationResultForm.spec.tsx
└── contracts/
    └── course-progress-stepper.spec.ts
```

**Structure Decision**: Web application (Next.js monolith) — existing `app/` + `components/` + `lib/` structure. No new directories at root level. Two new route segments under `app/my-courses/[bookingId]/`.

## Phase 0: Outline & Research

See [research.md](research.md) for full findings.

### Research Tasks Completed

1. MUI Stepper for sequential progress — horizontal orientation with custom icons and step states
2. MUI Drawer for testimonial flyout — right-anchored temporary drawer
3. @mui/x-date-pickers DatePicker — StaticDatePicker for full-month calendar display
4. Substep persistence strategy — derive from existing field values (no new DB columns)
5. Mux Player dynamic import — existing pattern in SummaryAssetList
6. Card-based selector pattern — MaterialTypeSelector reference

## Phase 1: Design & Contracts

See [data-model.md](data-model.md), [contracts/ui-contracts.md](contracts/ui-contracts.md), and [quickstart.md](quickstart.md).

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do — DO NOT execute during /plan._

**Task Generation Strategy**:

- Each new component → unit test task [P] + implementation task
- Each modified component → contract test task + refactor task
- Prisma migration → standalone task (early dependency)
- Route pages → task per route (depend on components)

**Ordering Strategy** (\[P\] = parallelizable within the group):

1. Prisma migration (prerequisite for result form)
2. Tests for new components [P]
3. New component implementations [P]
4. Tests for modified components [P]
5. Modified component refactors [P]
6. Route pages (nachbereitung, verhandlungsergebnis)
7. Integration: detail page cleanup (remove sections)
8. Integration: dashboard wiring (UserDashboard + stepper)
9. Label renames across all files
10. Smoke tests / manual QA

**Estimated Output**: ~28 numbered, ordered tasks in tasks.md