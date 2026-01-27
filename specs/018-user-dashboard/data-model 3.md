# Data Model: User Dashboard Enhancement

**Feature**: 018-user-dashboard  
**Created**: 2025-01-24

## Schema Changes

### 1. Course Model Extension

Add `endDate` field for multi-day course support:

```prisma
model Course {
  // ... existing fields ...
  startDate     DateTime?           @map("start_date")
  endDate       DateTime?           @map("end_date")    // NEW
  startTime     DateTime?           @map("start_time")
  endTime       DateTime?           @map("end_time")
  // ... rest of fields ...
}
```

**Migration**: `add_course_end_date`

---

### 2. Booking Model Extension

Add Stripe invoice fields:

```prisma
model Booking {
  // ... existing fields ...
  stripePaymentIntentId String?              @map("stripe_payment_intent_id")
  stripeSessionId       String?              @map("stripe_session_id")
  stripeInvoiceId       String?              @map("stripe_invoice_id")         // NEW
  stripeInvoiceUrl      String?              @map("stripe_invoice_url")        // NEW
  stripeInvoicePdfUrl   String?              @map("stripe_invoice_pdf_url")    // NEW
  // ... rest of fields ...
}
```

**Migration**: `add_stripe_invoice_fields`

---

## Entity Relationships

```
User (1) ──────< Booking (N) >────── Course (1)
                    │
                    │ 1:1 (optional)
                    ▼
           CourseParticipation
                    │
                    │ 1:N
                    ▼
        ParticipationDocument
        ParticipationSummaryOverride
```

### Booking Categorization Query

```typescript
// Pseudo-query for dashboard sections
const now = new Date();

// Section A: Nächstes Seminar (next upcoming)
const nextSeminar = bookings
  .filter(b => b.course.startDate > now && b.paymentStatus !== 'CANCELLED')
  .sort((a, b) => a.course.startDate - b.course.startDate)
  [0];

// Section B: Weitere gebuchte Seminare
const upcomingOthers = bookings
  .filter(b => b.course.startDate > now && b.id !== nextSeminar?.id && b.paymentStatus !== 'CANCELLED');

// Section C: Absolvierte Seminare
const completed = bookings
  .filter(b => (b.course.endDate || b.course.startDate) < now && b.participation !== null);

// Section D: Seminare ohne Teilnahme
const noShow = bookings
  .filter(b => (b.course.endDate || b.course.startDate) < now && b.participation === null && b.paymentStatus !== 'CANCELLED');
```

---

## Data Flow

### Invoice Data Capture

```
Stripe Checkout → checkout.session.completed webhook
                        │
                        ▼
              Retrieve Invoice from session.invoice
                        │
                        ▼
              Update Booking record:
              - stripeInvoiceId
              - stripeInvoiceUrl
              - stripeInvoicePdfUrl
```

### Dashboard Data Loading

```
/dashboard page load
        │
        ▼
GET /api/bookings (enhanced)
        │
        ▼
Include: course (with location), participation
        │
        ▼
Categorize into 4 sections
        │
        ▼
Render UserDashboard with sections
```

---

## Indexes

Existing indexes are sufficient:

- `@@index([startDate])` on Course - for date-based sorting
- `@@unique([userId, courseId])` on Booking - prevents duplicates
- `@@index([userId, status])` on CourseParticipation - for participation lookup

---

## Migration Strategy

1. **Step 1**: Add nullable `endDate` to Course (non-breaking)
2. **Step 2**: Add nullable invoice fields to Booking (non-breaking)
3. **Step 3**: Update webhook to populate invoice fields on new payments
4. **Step 4**: Backfill script for existing paid bookings (optional)

**Rollback**: Both migrations add nullable fields, no data loss on rollback.
