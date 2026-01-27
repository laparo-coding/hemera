# Implementation Plan: 021 Learning Path

**Branch**: `021-learning-path` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/021-learning-path/spec.md`

## Summary

Enhance course management with:
1. **Course recommendation fields** (`recommended`, `notRecommended`) for course detail page and admin forms
2. **Prerequisite booking check** with PRE_BOOKED status for non-qualified customers, admin review workflow, and Loops.so email notifications
3. **Non-public course flag** (`isNonPublic`) to hide invitation-only courses from public listings
4. **Outperformer flag** (`isOutperformer`) for user management

Technical approach: Extend Prisma schema with new fields, add PRE_BOOKED payment status, integrate Loops.so for transactional emails, and extend admin panel with review capabilities.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+
**Primary Dependencies**: Prisma ORM, Material-UI v5, Clerk auth, Loops.so SDK (new), Rollbar
**Storage**: PostgreSQL via Prisma (existing schema extension)
**Testing**: Jest for unit tests, Playwright for E2E
**Target Platform**: Vercel (production), Docker PostgreSQL (local)
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: Prerequisite check < 200ms, email sending async (non-blocking)
**Constraints**: Loops.so API failures must not block bookings (silent degradation)
**Scale/Scope**: ~100 courses, ~1000 users, 4 new DB fields

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Test-First Development** | ✅ PASS | Contract tests for prerequisite service, admin review API |
| **II. Code Quality & Formatting** | ✅ PASS | TypeScript strict, Prettier, ESLint |
| **III. Feature Development Workflow** | ✅ PASS | Spec-first approach followed, Prisma migrations planned |
| **IV. Authentication & Security** | ✅ PASS | Clerk admin role check for review actions |
| **V. Component Architecture** | ✅ PASS | MUI components, theme consistency |
| **VI. Holistic Error Handling** | ✅ PASS | Rollbar for Loops.so failures, silent degradation |
| **VII. Stripe Integration** | ✅ PASS | New PRE_BOOKED status integrates with existing flow |
| **Deployment Standards** | ✅ PASS | GitHub Actions exclusive |

**Initial Constitution Check: PASS** ✅

## Project Structure

### Documentation (this feature)

```
specs/021-learning-path/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (existing)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── admin-booking-review.yaml
│   ├── prerequisite-check.yaml
│   └── loops-email.yaml
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
prisma/
├── schema.prisma           # Extended with new fields + PRE_BOOKED status
└── migrations/
    └── xxx_learning_path/  # New migration

lib/
├── services/
│   ├── prerequisite.ts     # NEW: Prerequisite check logic
│   └── loops.ts            # NEW: Loops.so email service
├── schemas/admin/
│   └── course.ts           # Extended with new field validation
├── db/admin/
│   └── courses.ts          # Extended CRUD operations
└── types/
    └── admin.ts            # Extended types

components/
├── admin/
│   ├── CourseForm.tsx      # Extended with new fields
│   ├── BookingReviewPanel.tsx  # NEW: Admin review UI
│   └── UserOutperformerToggle.tsx  # NEW: User flag toggle
└── course-detail/
    └── CourseRecommendationSection.tsx  # NEW: Public display

app/
├── api/
│   ├── admin/
│   │   ├── bookings/[id]/review/route.ts  # NEW: Review endpoint
│   │   └── users/[id]/route.ts            # Extended: PATCH for isOutperformer
│   └── payment/
│       └── create-intent/route.ts          # Extended: Prerequisite check
└── admin/
    └── bookings/
        └── pending/page.tsx               # NEW: Pending reviews page

tests/
├── unit/
│   └── services/
│       ├── prerequisite.spec.ts   # NEW
│       └── loops.spec.ts          # NEW (mocked)
├── integration/
│   └── booking-prerequisite.spec.ts  # NEW
└── contracts/
    └── admin-booking-review.spec.ts  # NEW
```

**Structure Decision**: Next.js monolith structure. New services in `lib/services/`, new admin components in `components/admin/`, new API routes in `app/api/admin/`.

## Phase 0: Research (Complete)

Research was completed prior to planning. Key findings from [research.md](research.md):

| Decision | Rationale |
|----------|-----------|
| Loops.so for emails | Transactional email API, simple integration, no SMTP setup |
| PRE_BOOKED as new PaymentStatus | Distinguishes from PENDING (payment not yet started vs. needs review) |
| Clerk emails for prerequisite check | User can have multiple emails in Clerk account |
| CourseParticipation.status = COMPLETE | Strictest definition of "completed" course |
| Silent degradation for Loops.so | Booking flow must not be blocked by email failures |

**Phase 0: COMPLETE** ✅

## Phase 1: Design & Contracts

### 1.1 Data Model Changes

See [data-model.md](data-model.md) for full schema.

**Summary of changes:**

| Model | Field | Type | Migration |
|-------|-------|------|-----------|
| Course | `recommended` | VARCHAR(300) nullable | ADD COLUMN |
| Course | `notRecommended` | VARCHAR(300) nullable | ADD COLUMN |
| Course | `isNonPublic` | BOOLEAN default false | ADD COLUMN |
| User | `isOutperformer` | BOOLEAN default false | ADD COLUMN |
| PaymentStatus | `PRE_BOOKED` | ENUM value | ALTER TYPE |
| Booking | `reviewedAt` | TIMESTAMP nullable | ADD COLUMN |
| Booking | `reviewedBy` | VARCHAR nullable | ADD COLUMN |

### 1.2 API Contracts

See [contracts/](contracts/) directory for OpenAPI specs.

**New Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/api/admin/bookings/{id}/review` | Approve/reject PRE_BOOKED booking |
| GET | `/api/admin/bookings/pending` | List PRE_BOOKED bookings |
| PATCH | `/api/admin/users/{id}` | Update user (isOutperformer) |

**Modified Endpoints:**

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/payment/create-intent` | Add prerequisite check, return PRE_BOOKED if not qualified |

### 1.3 Service Contracts

**PrerequisiteService** (`lib/services/prerequisite.ts`):
```typescript
interface PrerequisiteResult {
  qualified: boolean;
  missingLevel: 'BEGINNER' | 'INTERMEDIATE' | null;
  completedCourses: string[];
}

function checkPrerequisite(clerkUserId: string, targetCourseLevel: CourseLevel): Promise<PrerequisiteResult>
```

**LoopsService** (`lib/services/loops.ts`):
```typescript
function sendPrerequisiteReviewEmail(data: {
  customerName: string;
  customerEmail: string;
  courseName: string;
  missingPrerequisite: string;
  bookingId: string;
  adminEmails: string[];
}): Promise<{ success: boolean; error?: string }>

function sendBookingRejectedEmail(data: {
  customerEmail: string;
  customerName: string;
  courseName: string;
}): Promise<{ success: boolean; error?: string }>
```

### 1.4 Component Contracts

**CourseRecommendationSection** (public course detail):
```typescript
interface Props {
  recommended: string | null;
  notRecommended: string | null;
}
```

**BookingReviewPanel** (admin):
```typescript
interface Props {
  bookings: PendingBooking[];
  onApprove: (bookingId: string) => Promise<void>;
  onReject: (bookingId: string) => Promise<void>;
}
```

**Post-Design Constitution Check: PASS** ✅

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Database Layer (5 tasks)**
   - Prisma schema changes
   - Migration creation and testing
   - Zod schema updates

2. **Service Layer (4 tasks)**
   - PrerequisiteService with unit tests
   - LoopsService with mocked tests
   - Admin email fetching from Clerk

3. **API Layer (4 tasks)**
   - Booking review endpoint with contract tests
   - User PATCH endpoint extension
   - Payment intent prerequisite integration

4. **Frontend - Admin (5 tasks)**
   - CourseForm field extensions
   - BookingReviewPanel component
   - Pending bookings page
   - User outperformer toggle

5. **Frontend - Public (2 tasks)**
   - CourseRecommendationSection component
   - Course detail page integration

6. **Integration & E2E (3 tasks)**
   - Full prerequisite flow test
   - Admin review workflow test
   - Loops.so degradation test

**Ordering Strategy**:
- TDD order: Contract tests → Unit tests → Implementation
- Dependency order: Schema → Services → API → Frontend
- [P] marks parallel-safe tasks

**Estimated Output**: ~23 numbered, ordered tasks

## Complexity Tracking

_No constitution violations requiring justification._

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-----------|-------------------------------------|
| (none) | - | - |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 30 tasks in tasks.md
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---

**STOP - Ready for /tasks command**

_Based on Constitution v1.10.0 - See `.specify/memory/constitution.md`_
