# Implementation Plan: User Dashboard Enhancement

**Branch**: `018-user-dashboard` | **Date**: 2025-01-24 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/018-user-dashboard/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✓
2. Fill Technical Context ✓
3. Fill Constitution Check section ✓
4. Evaluate Constitution Check → PASS
5. Execute Phase 0 → research.md ✓
6. Execute Phase 1 → contracts, data-model.md, quickstart.md ✓
7. Re-evaluate Constitution Check → PASS
8. Plan Phase 2 → Describe task generation approach ✓
9. STOP - Ready for /tasks command
```

## Summary

Enhance the user dashboard with a four-section layout (Nächstes Seminar, Weitere gebuchte Seminare, Absolvierte Seminare, Seminare ohne Teilnahme), extended course cards showing dates/times/location, a dedicated user course detail page with Vorbereitung/Ergebnisse/Nachbereitung sections, and Stripe invoice PDF download integration for all paid bookings.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.5.6 (App Router)  
**Primary Dependencies**: React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Stripe (payments)  
**Storage**: PostgreSQL via Prisma ORM  
**Testing**: Jest (unit), Playwright (E2E)  
**Target Platform**: Web (desktop + mobile responsive)  
**Project Type**: Web (Next.js full-stack)  
**Performance Goals**: LCP < 2.5s, Dashboard load < 2s, Invoice download < 3s  
**Constraints**: German localization, Rollbar error monitoring, TDD workflow  
**Scale/Scope**: Multi-user dashboard with booking/participation data

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ PASS | Contract tests defined before implementation |
| Prettier/ESLint Compliance | ✅ PASS | Standard tooling applies |
| Clerk Authentication | ✅ PASS | All dashboard routes protected via middleware |
| Stripe Security | ✅ PASS | Invoice access restricted to booking owner, server-side only |
| Rollbar Error Monitoring | ✅ PASS | All API errors logged via Rollbar |
| Prisma Schema Conventions | ✅ PASS | snake_case DB columns, camelCase fields, @@map directives |
| GitHub Actions Deployment | ✅ PASS | No manual deployments |
| Performance Budget | ✅ PASS | LCP < 2.5s target aligned with NFRs |
| German Localization | ✅ PASS | All UI text in informal German ("Du") |

## Project Structure

### Documentation (this feature)

```
specs/018-user-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-bookings.md
│   └── api-invoice.md
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
app/
├── dashboard/
│   └── page.tsx                      # Enhanced dashboard with 4 sections
├── my-courses/
│   ├── page.tsx                      # List view (existing)
│   └── [bookingId]/
│       └── page.tsx                  # NEW: User course detail page
├── api/
│   └── bookings/
│       ├── route.ts                  # Enhanced with course dates/location
│       └── [bookingId]/
│           └── invoice/
│               └── route.ts          # NEW: Invoice download endpoint

components/
├── UserDashboard.tsx                 # Refactored with 4-section layout
├── dashboard/
│   ├── CourseCard.tsx                # NEW: Enhanced course card component
│   ├── DashboardSection.tsx          # NEW: Reusable section wrapper
│   └── InvoiceDownloadButton.tsx     # NEW: Invoice download button
└── participation/
    ├── CourseParticipationStepper.tsx # Existing
    ├── ResultsSection.tsx            # NEW: Video + materials display
    └── DebriefingSection.tsx         # NEW: Summary display

lib/
├── services/
│   └── stripe.ts                     # Extended with getInvoicePdfUrl
└── actions/
    └── participation.ts              # Extended with section navigation

prisma/
├── schema.prisma                     # Extended Booking model
└── migrations/
    └── YYYYMMDD_add_stripe_invoice_fields/

tests/
├── unit/
│   ├── components/
│   │   ├── CourseCard.spec.tsx
│   │   ├── DashboardSection.spec.tsx
│   │   └── InvoiceDownloadButton.spec.tsx
│   └── services/
│       └── stripe-invoice.spec.ts
├── integration/
│   └── api/
│       └── bookings-invoice.spec.ts
└── e2e/
    └── dashboard-sections.spec.ts
```

**Structure Decision**: Web application (Next.js App Router) with existing component/lib/app structure. New components in `components/dashboard/`, new API routes in `app/api/bookings/`, new page in `app/my-courses/[bookingId]/`.

## Phase 0: Outline & Research

**Research Areas Identified:**

1. **Stripe Invoice API** → Best practices for retrieving invoice PDFs
2. **Course Date/Time Display** → Handling multi-day courses vs single-day
3. **Booking Categorization** → Logic for upcoming/completed/no-show classification
4. **Existing Participation Flow** → Integration with CourseParticipationStepper

**Findings Summary:**

- Stripe Invoice: Use `session.invoice` from checkout.session.completed webhook, store `invoice_pdf` URL
- Multi-day Detection: Compare startDate and endDate (if Course model has both) or use startDate + duration
- Booking Classification: Use `course.startDate`, `course.endTime`, and `participation` existence
- Participation: Existing `CourseParticipationStepper` handles Vorbereitung; extend for Ergebnisse/Nachbereitung

**Output**: See [research.md](./research.md)

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

### Entities from Feature Spec

**Booking** (Extended):
- `stripeInvoiceId`: String? - Stripe Invoice ID
- `stripeInvoiceUrl`: String? - Hosted invoice URL
- `stripeInvoicePdfUrl`: String? - Direct PDF download URL

**Course** (Existing - enhancement needed):
- Already has `startDate`, `startTime`, `endTime`, `locationId`
- Need to add `endDate` field for multi-day course support

### API Contracts

**GET /api/bookings** (Enhanced Response):
```typescript
{
  success: boolean;
  data: {
    bookings: Array<{
      id: string;
      courseId: string;
      courseTitle: string;
      coursePrice: number;
      currency: string;
      paymentStatus: string;
      createdAt: string;
      // NEW fields:
      startDate: string | null;
      endDate: string | null;
      startTime: string | null;
      endTime: string | null;
      locationId: string | null;
      locationName: string | null;
      locationSlug: string | null;
      hasParticipation: boolean;
      stripeInvoicePdfUrl: string | null;
    }>;
  };
}
```

**GET /api/bookings/[bookingId]/invoice**:
```typescript
// Success: 302 Redirect to Stripe PDF URL
// Error responses:
{ success: false; error: 'Unauthorized' }     // 401
{ success: false; error: 'Booking not found' } // 404
{ success: false; error: 'Forbidden' }         // 403
{ success: false; error: 'Invoice not available' } // 404
```

### Test Scenarios from User Stories

1. Dashboard displays 4 sections in correct order
2. "Nächstes Seminar" shows only the next upcoming course with action buttons
3. "Weitere gebuchte Seminare" hidden when only 1 future booking
4. Course card shows date, time, location with link
5. Invoice download button appears for paid bookings
6. User course detail page shows Vorbereitung/Ergebnisse/Nachbereitung tabs
7. "Absolvierte Seminare" shows courses with participation and invoice button
8. "Seminare ohne Teilnahme" shows no-show courses

**Output**: See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Database Migration Tasks** (P - Parallel)
   - Add `endDate` to Course model
   - Add invoice fields to Booking model

2. **Contract Test Tasks** (P - Parallel)
   - GET /api/bookings enhanced response test
   - GET /api/bookings/[id]/invoice auth/download test

3. **Component Tasks** (Sequential - dependencies)
   - CourseCard component with date/time/location
   - DashboardSection wrapper component
   - InvoiceDownloadButton component
   - ResultsSection (video + materials)
   - DebriefingSection (summary)

4. **API Enhancement Tasks**
   - Extend /api/bookings response with course details
   - Create /api/bookings/[id]/invoice endpoint
   - Extend Stripe webhook for invoice capture

5. **Page/Layout Tasks**
   - Refactor UserDashboard.tsx with 4-section layout
   - Create /my-courses/[bookingId]/page.tsx detail page

6. **Integration Tasks**
   - Wire up booking categorization logic
   - Connect invoice download flow
   - E2E test suite

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Schema → API → Components → Pages
- Mark [P] for parallel execution (independent files)

**Estimated Output**: ~28 numbered, ordered tasks in tasks.md

## Complexity Tracking

_No complexity deviations required - design follows existing patterns._

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| 4 Dashboard Sections | Simple conditional rendering | Uses existing booking data + participation check |
| Invoice Download | Redirect to Stripe PDF URL | No file storage needed, uses Stripe-hosted PDF |
| Course Detail Page | New route /my-courses/[bookingId] | Extends existing /my-courses pattern |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---

_Based on Constitution v1.10.0 - See `.specify/memory/constitution.md`_
