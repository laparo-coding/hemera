# Research: User Dashboard Enhancement

**Feature**: 018-user-dashboard  
**Created**: 2025-01-24

## Research Areas

### 1. Stripe Invoice API

**Decision**: Capture invoice data from `checkout.session.completed` webhook event

**Rationale**: 
- Stripe automatically creates invoices for checkout sessions
- The `session.invoice` field contains the invoice ID
- Invoice object has `invoice_pdf` URL for direct PDF download
- Storing URL in DB avoids repeated Stripe API calls

**Alternatives Considered**:
- Fetch invoice on-demand from Stripe API → Rejected (latency, API rate limits)
- Generate custom invoices → Rejected (Stripe invoices are legally compliant)

**Implementation Reference**: See `plans/stripe-invoice-download-feature.md`

---

### 2. Course Date/Time Display

**Decision**: Add `endDate` field to Course model; display endDate only when different from startDate

**Rationale**:
- Current Course model has `startDate`, `startTime`, `endTime` but no `endDate`
- Multi-day courses need explicit end date
- Single-day courses: show only startDate
- Multi-day courses: show "startDate - endDate"

**Alternatives Considered**:
- Calculate duration from startTime/endTime → Rejected (doesn't work for multi-day)
- Store duration in hours → Rejected (less intuitive for display)

---

### 3. Booking Categorization Logic

**Decision**: Categorize bookings based on course dates and participation existence

**Categories**:
1. **Nächstes Seminar**: `course.startDate > now` AND is the earliest upcoming booking
2. **Weitere gebuchte Seminare**: `course.startDate > now` AND NOT the earliest
3. **Absolvierte Seminare**: `course.endDate < now` AND `participation` exists
4. **Seminare ohne Teilnahme**: `course.endDate < now` AND `participation` does NOT exist

**Rationale**:
- Uses existing `CourseParticipation` model to determine actual attendance
- No-show detection is automatic (past course without participation record)
- Clear separation of responsibilities

**Edge Cases**:
- Course currently in progress (startDate <= now <= endDate): Show in "Nächstes Seminar"
- Cancelled bookings (paymentStatus = CANCELLED): Exclude from all sections

---

### 4. Existing Participation Flow Integration

**Decision**: Extend existing `CourseParticipationStepper` component for new sections

**Current Implementation** (from `app/my-courses/MyCoursesClient.tsx`):
- `CourseParticipationStepper` handles PREPARATION → SUMMARY → DEBRIEFING → RESULT → COMPLETE
- `getMyEnrollmentsAction()` fetches bookings with participation data
- Accordion-based UI for each enrollment

**Extension Plan**:
- Vorbereitung: Reuse existing preparation step logic
- Ergebnisse: New section showing `CourseSummaryAsset` videos + materials
- Nachbereitung: New section showing debriefing content/summary

**Alternatives Considered**:
- Build completely new participation UI → Rejected (duplication of effort)
- Embed in existing accordion → Rejected (need dedicated page for deep linking)

---

## Technical Dependencies Confirmed

| Dependency | Version | Purpose |
|------------|---------|---------|
| Stripe SDK | Current | Invoice retrieval and PDF URLs |
| Prisma | Current | Schema extension for invoice fields |
| Material-UI | v5 | UI components for cards and sections |
| Clerk | Current | User authentication for invoice access control |
| Mux | Current | Video playback in Ergebnisse section |

---

## Open Questions Resolved

| Question | Answer | Source |
|----------|--------|--------|
| Invoice format | Stripe-hosted PDF | Stripe API docs |
| Multi-day course definition | Separate endDate field | Schema analysis |
| No-show detection | Absence of participation record | Clarification session |
| Section visibility | Hide empty sections | Clarification session |
