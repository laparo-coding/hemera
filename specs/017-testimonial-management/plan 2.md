# Implementation Plan: Testimonial Management

**Branch**: `feature/017-testimonial-management` | **Date**: 2025-01-15 | **Spec**: [spec.md](spec.md)

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✅
2. Fill Technical Context ✅
3. Fill Constitution Check section ✅
4. Evaluate Constitution Check ✅ PASS
5. Execute Phase 0 → research.md ✅
6. Execute Phase 1 → data-model.md, quickstart.md ✅
7. Re-evaluate Constitution Check ✅ PASS
8. Plan Phase 2 → Task generation approach ✅
9. STOP - Ready for /tasks command
```

## Summary

Implement a testimonial system allowing course participants to share their experiences. Participants create testimonials via the user dashboard with WYSIWYG preview. Testimonials require admin approval before appearing on course detail pages beneath the "Termin und Preis" section. Each testimonial displays the participant's statement, profile photo (from Clerk), and name in a user-selected format (full name + city, full name, first name + initial, or first name only).

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.5.6 (App Router)  
**Primary Dependencies**: React 18, Material-UI v5, Clerk auth, Prisma ORM, Rollbar monitoring  
**Storage**: PostgreSQL via Prisma models (new Testimonial entity)  
**Testing**: Jest + React Testing Library for units, Playwright for E2E  
**Target Platform**: Web (Next.js SSR + client transitions)  
**Project Type**: web  
**Performance Goals**: Respect Lighthouse budgets (FCP < 1.8s, LCP < 2.5s, CLS < 0.1)  
**Constraints**: Admin approval workflow, 1000 char limit, one testimonial per booking  
**Scale/Scope**: All course participants; testimonials displayed on public course pages

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Test-First Development (I)**: ✅ PASS – Contract tests defined before implementation; unit tests for components; E2E for approval workflow
- **Code Quality & Formatting (II)**: ✅ PASS – Biome/Prettier formatting enforced; strict TypeScript
- **Feature Workflow (III)**: ✅ PASS – Spec-first process followed; Prisma migration strategy defined; Clerk integration for profile data
- **Authentication & Security (IV)**: ✅ PASS – Clerk auth required for testimonial creation; admin role for approval; no PII leakage
- **Holistic Error Handling & Observability (VI)**: ✅ PASS – Rollbar for API errors; graceful fallback for missing profile data
- **Stripe Integration (VII)**: ✅ N/A – No payment flows introduced

## Project Structure

### Documentation (this feature)

```
specs/017-testimonial-management/
├── spec.md              # Feature specification ✅
├── plan.md              # This file ✅
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Phase 1 output (API schemas)
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
app/
├── api/
│   └── testimonials/           # API routes for CRUD + approval
│       ├── route.ts            # GET (list), POST (create)
│       └── [id]/
│           └── route.ts        # PATCH (update/approve), DELETE
├── courses/
│   └── [slug]/
│       └── page.tsx            # Add TestimonialSection component
├── my-courses/
│   └── [slug]/
│       └── page.tsx            # Add TestimonialForm component
└── admin/
    └── testimonials/
        └── page.tsx            # Admin approval dashboard

components/
├── testimonials/
│   ├── TestimonialCard.tsx     # Display component (shared)
│   ├── TestimonialForm.tsx     # Input form with preview
│   ├── TestimonialSection.tsx  # Course detail page section
│   └── TestimonialAdminList.tsx # Admin approval list

lib/
├── actions/
│   └── testimonials.ts         # Server actions
├── schemas/
│   └── testimonial.ts          # Zod validation
└── services/
    └── testimonialService.ts   # Business logic

prisma/
└── schema.prisma               # Add Testimonial model + enums
```

**Structure Decision**: Web application with Next.js App Router. Frontend components in `/components/testimonials/`, API routes in `/app/api/testimonials/`, server actions in `/lib/actions/`.

## Phase 0: Research ✅

Research completed in [research.md](research.md). Key decisions:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data Model | Testimonial → Booking (1:1) | Consistent with CourseParticipation; enforces eligibility |
| Name Display | Enum with 4 options | Clear UI mapping; cached at write time |
| Status Workflow | DRAFT → PENDING → PUBLISHED / HIDDEN | Supports admin approval; soft-delete via HIDDEN |
| Caching | Store computed displayName + photoUrl | Avoid Clerk API calls on public page render |

## Phase 1: Design & Contracts ✅

### Data Model

Defined in [data-model.md](data-model.md). New entities:

- **Testimonial**: Statement, name format, cached display data, status, booking/course relations
- **NameDisplayFormat** enum: FULL_NAME_CITY, FULL_NAME, FIRST_INITIAL, FIRST_NAME_ONLY
- **TestimonialStatus** enum: DRAFT, PENDING, PUBLISHED, HIDDEN

### API Contracts

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/testimonials` | GET | List testimonials (filter by course/user/status) | Public (PUBLISHED) / Auth (own) |
| `/api/testimonials` | POST | Create testimonial for booking | Authenticated participant |
| `/api/testimonials/[id]` | GET | Get single testimonial | Public (PUBLISHED) / Auth (own) |
| `/api/testimonials/[id]` | PATCH | Update statement/format or change status | Owner (edit) / Admin (approve) |
| `/api/testimonials/[id]` | DELETE | Soft-delete (set HIDDEN) | Admin only |

### Quickstart

Defined in [quickstart.md](quickstart.md). Validation steps:
1. Create booking for test user
2. Submit testimonial via dashboard form
3. Verify PENDING status
4. Admin approves testimonial
5. Verify appears on course detail page

## Phase 2: Task Generation Approach

_Executed by /tasks command_

**Task Generation Strategy**:
- Contract tests for each API endpoint (5 tasks)
- Prisma migration for new entities (1 task)
- Service layer with business logic (1 task)
- Form component with WYSIWYG preview (2 tasks)
- Display component for course page (1 task)
- Admin approval dashboard (2 tasks)
- E2E tests for complete flow (2 tasks)

**Ordering Strategy**:
1. Database migration (foundation)
2. Contract tests (TDD: write failing tests)
3. API implementation (make tests pass)
4. Component development (form → display)
5. Admin UI (approval workflow)
6. E2E validation

**Estimated Output**: ~15 numbered tasks

## Progress Tracking

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | ✅ Complete | research.md |
| Phase 1: Design | ✅ Complete | data-model.md, quickstart.md |
| Constitution Check (Initial) | ✅ PASS | All gates passed |
| Constitution Check (Post-Design) | ✅ PASS | No new violations |
| Phase 2: Tasks | ✅ Complete | tasks.md (22 tasks) |
