# PRE_BOOKED Approval Workflow - Developer Documentation

## Overview

Feature: **021-learning-path**  
Status: **Implemented with Review Endpoint**

The PRE_BOOKED workflow allows users who don't meet course prerequisites to request admin approval before payment. This document describes the complete approval/rejection flow for developers.

**Important:** The prerequisite check and PRE_BOOKED workflow **only applies to INTERMEDIATE and ADVANCED courses**. BEGINNER courses are always bookable without prerequisites and skip this entire workflow.

---

## Workflow States

```
┌─────────────────┐
│  User Attempts  │
│  to Book Course │
└────────┬────────┘
         │
         v
  ┌──────────────┐
  │ Course Level │
  │    Check     │
  └──────┬───────┘
         │
    ┌────┴────────────────┐
    │                     │
    v                     v
┌─────────┐      ┌────────────────┐
│BEGINNER │      │INTERMEDIATE or │
│         │      │ADVANCED        │
└────┬────┘      └────────┬───────┘
     │                    │
     │                    v
     │           ┌──────────────┐
     │           │ Prerequisite │
     │           │    Check     │
     │           └──────┬───────┘
     │                  │
     │             ┌────┴────┐
     │             │         │
     │             v         v
     │          ┌──────┐   ┌────────┐
     │          │Fail  │   │Pass    │
     │          └──┬───┘   └───┬────┘
     │             │           │
     │             v           │
     │          ┌────────────┐ │
     │          │PRE_BOOKED  │ │
     │          │Status      │ │
     │          │            │ │
     │          └──────┬─────┘ │
     │                 │       │
     │                 v       │
     │          ┌──────────────┐│
     │          │Admin Review  ││
     │          │Dashboard     ││
     │          └──────┬───────┘│
     │                 │        │
     │              ┌──┴───┐    │
     │              │      │    │
     │              v      v    │
     │          ┌──────┐ ┌─────────┐
     │          │Approve│ │Reject  │
     │          └───┬──┘ └───┬────┘
     │              │        │
     └───────┬──────┘        │
             │               │
             v               v
         ┌──────────┐ ┌──────────┐
         │PENDING   │ │CANCELLED │
         │(Normal   │ │+ Email   │
         │Checkout) │ │          │
         └──────────┘ └──────────┘
```

---

## API Endpoints

### 1. Create Booking with Prerequisite Check

**Endpoint:** `POST /api/payment/create-intent`

**Description:** Creates booking and checks prerequisites automatically for INTERMEDIATE/ADVANCED courses. BEGINNER courses skip prerequisite check entirely.

**Request:**
```json
{
  "courseId": "course_abc123"
}
```

**Response (BEGINNER Course - Direct Checkout):**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "bookingId": "booking_xyz789"
}
```

**Response (Not Qualified - PRE_BOOKED):**
```json
{
  "requiresReview": true,
  "bookingId": "booking_xyz789",
  "message": "Deine Buchung wurde zur Prüfung eingereicht. Du wirst benachrichtigt, sobald sie freigegeben wurde.",
  "missingPrerequisite": "BEGINNER"
}
```

**Response (Qualified - Normal Flow):**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "bookingId": "booking_xyz789"
}
```

**Implementation:**
- File: `app/api/payment/create-intent/route.ts`
- Uses: `handleBookingWithPrerequisites()` orchestrator
- Creates: `PRE_BOOKED` status booking if not qualified (INTERMEDIATE/ADVANCED only)
- Optimization: BEGINNER courses skip prerequisite DB queries entirely
- Sends: Admin notification email

---

### 2. Admin Review Endpoint

**Endpoint:** `PATCH /api/admin/bookings/{id}/review`

**Description:** Approve or reject a PRE_BOOKED booking.

**Authentication:** Required (Admin role)

**Request (Approve):**
```json
{
  "action": "approve"
}
```

**Request (Reject):**
```json
{
  "action": "reject"
}
```

**Response (Approved):**
```json
{
  "success": true,
  "data": {
    "id": "booking_xyz789",
    "paymentStatus": "PENDING",
    "reviewedAt": "2026-01-27T10:30:00.000Z",
    "reviewedBy": "admin_user_123",
    "message": "Booking approved successfully"
  },
  "requestId": "req_abc123"
}
```

**Response (Rejected):**
```json
{
  "success": true,
  "data": {
    "id": "booking_xyz789",
    "message": "Booking rejected and removed"
  },
  "requestId": "req_abc123"
}
```

**Implementation:**
- File: `app/api/admin/bookings/[id]/review/route.ts`
- Approve: Uses atomic `updateMany` with `paymentStatus: PRE_BOOKED` precondition
- Reject: Uses atomic `deleteMany` with `paymentStatus: PRE_BOOKED` precondition
- Race Condition Protection: Returns 409 if status changed during review
- Email: `sendBookingRejectedEmail()` on rejection

**Race Condition Prevention:**
```typescript
// Atomic update with status precondition
await prisma.booking.updateMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // Only update if still PRE_BOOKED
  },
  data: {
    paymentStatus: 'PENDING',
    reviewedAt: new Date(),
    reviewedBy: userId,
  },
});
```

---

## Database Schema

### Booking Model Extensions

```prisma
model Booking {
  id                    String               @id @default(cuid())
  userId                String               @map("user_id")
  courseId              String               @map("course_id")
  paymentStatus         PaymentStatus        @default(PENDING)
  
  // Learning Path (021): Admin review fields
  reviewedAt            DateTime?            @map("reviewed_at")
  reviewedBy            String?              @map("reviewed_by")
  reviewNotes           String?              @map("review_notes")
  
  @@map("bookings")
}

enum PaymentStatus {
  PENDING
  PRE_BOOKED     // NEW: Awaiting admin approval
  PAID
  FAILED
  CANCELLED
  REFUNDED
  CONFIRMED
}
```

---

## Service Layer

### Orchestrator: `lib/services/booking-orchestrator.ts`

**Purpose:** Coordinates booking creation with prerequisite checking and notifications.

**Main Functions:**

#### `handleBookingWithPrerequisites()`
- Validates course level
- Checks user prerequisites
- Routes to PRE_BOOKED or normal flow
- Returns structured result

**Usage:**
```typescript
const result = await handleBookingWithPrerequisites({
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  course: courseData,
});

if (result.requiresReview) {
  // Show PRE_BOOKED UI
} else {
  // Continue to payment
}
```

#### `createPreBookedWithNotification()`
- Creates PRE_BOOKED booking
- Fetches admin emails
- Sends notification (non-blocking)
- Returns booking result

---

## Email Notifications

### Admin Notification (`sendPrerequisiteReviewEmail`)

**Trigger:** When PRE_BOOKED booking is created

**Template ID:** `prerequisite-review` (Loops.so)

**Recipients:** All users with `role: 'admin'` in Clerk metadata

**Data Variables:**
```typescript
{
  customer_name: "John",
  customer_email: "j***n@example.com",  // Masked in logs
  course_name: "Advanced Laparoscopy",
  course_level: "Fortgeschrittenen-Kurs",
  missing_prerequisite: "Basis",
  admin_link: "https://app.hemera-academy.de/admin/bookings/pending"
}
```

### Customer Rejection Email (`sendBookingRejectedEmail`)

**Trigger:** When admin rejects PRE_BOOKED booking

**Template ID:** `booking-rejected` (Loops.so)

**Data Variables:**
```typescript
{
  customer_name: "John",
  course_name: "Advanced Laparoscopy",
  support_email: "support@hemera-academy.de"
}
```

---

## UI Components

### Implemented Components

✅ **BookingReviewDialog** (`components/admin/BookingReviewDialog.tsx`)
- Modal dialog for approve/reject
- Admin notes field
- Confirmation flow

✅ **CourseForm** (`components/admin/CourseForm.tsx`)
- Learning Path fields (recommended, notRecommended, isNonPublic)
- Character counters with visual warnings
- MUI Checkbox components

### TODO: Missing UI Elements

```typescript
// TODO: Create admin dashboard for PRE_BOOKED bookings
// File: app/admin/bookings/pending/page.tsx
// Features:
// - List all PRE_BOOKED bookings
// - Filter by course/user
// - Quick approve/reject actions
// - Bulk operations
// - Prerequisite completion history view

// TODO: Customer notification UI
// File: app/my-courses/page.tsx or dashboard
// Features:
// - Show PRE_BOOKED status badge
// - Estimated review time
// - Re-check prerequisite button (if completed during wait)

// TODO: Admin dashboard widget
// File: app/admin/dashboard/page.tsx
// Features:
// - Count of pending reviews
// - Alert badge for bookings >48h old
// - Quick link to review queue

// TODO: Email template preview
// File: app/admin/settings/email-templates/page.tsx
// Features:
// - Preview prerequisite-review email
// - Preview booking-rejected email
// - Test email sending
```

---

## Error Handling

### Race Condition Protection

**Atomic Operations:**
```typescript
// app/api/admin/bookings/[id]/review/route.ts

// Approve: Atomic update with status precondition
const result = await prisma.booking.updateMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // Atomic precondition
  },
  data: {
    paymentStatus: 'PENDING',
    reviewedAt: new Date(),
    reviewedBy: userId,
  },
});

if (result.count === 0) {
  // Status changed during review - return 409 Conflict
  return { error: 'Booking status changed during review' };
}

// Reject: Atomic delete with status precondition
const deleteResult = await prisma.booking.deleteMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // Atomic precondition
  },
});

if (deleteResult.count === 0) {
  // Status changed during review - return 409 Conflict
  return { error: 'Booking status changed during review' };
}
```

**Why This Matters:**
- Prevents double-approval if two admins review simultaneously
- Prevents approval of already-cancelled bookings
- Ensures `reviewedAt` and `reviewedBy` are only set once
- Returns clear 409 Conflict error on race condition

### Schema Validation

**Booking Transition Rules:**
```typescript
// lib/services/booking.ts

// ✅ Allowed: No existing booking → PRE_BOOKED
// ✅ Allowed: CANCELLED → PRE_BOOKED (retry)
// ❌ Blocked: PENDING → PRE_BOOKED
// ❌ Blocked: PAID → PRE_BOOKED
// ❌ Blocked: PRE_BOOKED → PRE_BOOKED (duplicate)
// ❌ Blocked: FAILED → PRE_BOOKED
```

**Email Guards:**
```typescript
// lib/services/loops.ts

// Guards against:
// - Empty/null customer email
// - No admin emails found
// - Invalid email format (missing @)
// - LOOPS_API_KEY not configured
```

### Logging Strategy

**Structured Logging:**
- Context: Always include `bookingId`, `userId`, `courseId`
- PII Protection: Mask email addresses (`j***n@example.com`)
- Error Sanitization: Never log full error objects (tokens/headers)
- Severity Levels: `error`, `warn`, `info`

**Example:**
```typescript
serverInstance.warn('Email send skipped - invalid recipient', {
  context: 'LoopsService.sendPrerequisiteReviewEmail',
  bookingId: data.bookingId,
  templateId: TRANSACTIONAL_IDS.PREREQUISITE_REVIEW,
  reason: 'customerEmail is empty or invalid',
});
```

---

## Testing

### Unit Tests

✅ **Booking Transitions** (`tests/unit/services/booking-transitions.spec.ts`)
- 12 tests covering PRE_BOOKED creation rules
- Status transition validation
- Duplicate prevention

✅ **Booking Orchestrator** (`tests/unit/services/booking-orchestrator.spec.ts`)
- 13 tests covering orchestration logic
- Email notification handling
- Error scenarios

### Integration Tests

✅ **Contract Tests** (`tests/contracts/admin-booking-review.spec.ts`)
- PATCH /api/admin/bookings/{id}/review endpoint
- Request/response validation
- Error handling

### TODO: Missing Tests

```typescript
// TODO: E2E test for complete approval flow
// File: tests/e2e/booking-approval-flow.spec.ts
// Scenarios:
// - User creates PRE_BOOKED booking
// - Admin receives email
// - Admin approves booking
// - Customer receives payment link
// - Customer completes payment

// TODO: E2E test for rejection flow
// File: tests/e2e/booking-rejection-flow.spec.ts
// Scenarios:
// - User creates PRE_BOOKED booking
// - Admin rejects booking
// - Customer receives rejection email
// - Booking is deleted

// TODO: Performance test
// File: tests/performance/concurrent-bookings.spec.ts
// Test: Multiple users booking same course simultaneously
// Verify: No duplicate PRE_BOOKED entries
```

---

## Configuration

### Environment Variables

```bash
# Email Service (Loops.so)
LOOPS_API_KEY=loops_***           # Required for email notifications
SUPPORT_EMAIL=support@hemera-academy.de

# App URL for admin links
NEXT_PUBLIC_APP_URL=https://app.hemera-academy.de
```

### Clerk Metadata

**Admin Role Configuration:**
```json
{
  "publicMetadata": {
    "role": "admin"
  }
}
```

**How to set:**
1. Clerk Dashboard → Users
2. Select user
3. Edit → Public Metadata
4. Add `{"role": "admin"}`

---

## Deployment Checklist

Before deploying PRE_BOOKED feature to production:

- [ ] Configure LOOPS_API_KEY in Vercel
- [ ] Create email templates in Loops.so dashboard:
  - [ ] `prerequisite-review` template
  - [ ] `booking-rejected` template
- [ ] Set at least one admin user in Clerk (role: 'admin')
- [ ] Test email delivery to admin addresses
- [ ] Test email delivery to customer addresses
- [ ] Verify admin review endpoint authentication
- [ ] Run database migrations (if schema changed)
- [ ] Update API documentation
- [ ] Notify support team of new workflow
- [ ] Create admin training materials
- [ ] Set up monitoring alerts for stuck bookings

---

## Monitoring

### Metrics to Track

1. **PRE_BOOKED Booking Volume**
   - Count per day/week
   - Conversion rate (approved vs rejected)

2. **Review Time**
   - Average time from creation to review
   - P95 review time
   - Bookings >48h old (alert threshold)

3. **Email Delivery**
   - Admin notification success rate
   - Customer rejection email success rate
   - Bounce rate

4. **Error Rates**
   - Email send failures
   - Invalid email addresses
   - API endpoint errors

### Rollbar Tags

```typescript
// Recommended tags for monitoring:
{
  feature: 'learning-path',
  workflow: 'pre-booked-approval',
  status: 'PRE_BOOKED',
  context: 'BookingOrchestrator.*'
}
```

---

## Troubleshooting

### Common Issues

**Issue:** PRE_BOOKED bookings not appearing in admin dashboard
- **Cause:** Missing UI implementation
- **Fix:** Implement `app/admin/bookings/pending/page.tsx` (see TODO)

**Issue:** Admin doesn't receive notification email
- **Causes:**
  1. No admin role in Clerk metadata
  2. LOOPS_API_KEY not configured
  3. Email template missing in Loops.so
- **Debug:** Check Rollbar for `LoopsService.*` warnings

**Issue:** Customer doesn't receive rejection email
- **Causes:**
  1. Invalid/empty customer email
  2. Email template missing
  3. Loops.so API down
- **Debug:** Non-blocking - booking is still deleted successfully

**Issue:** Duplicate PRE_BOOKED bookings
- **Cause:** Race condition or validation bug
- **Check:** Unit tests in `booking-transitions.spec.ts`
- **Fix:** Review transition guards in `lib/services/booking.ts`

---

## Future Enhancements

### Planned Features

1. **Auto-approval Rules**
   - Define conditions for automatic approval
   - Example: User completed prerequisite during wait time

2. **Prerequisite Verification**
   - Upload completion certificate
   - Link to external course completion proof

3. **Review Time SLA**
   - Alert if booking not reviewed within 24h
   - Auto-escalation to senior admin

4. **Customer Portal**
   - View review status
   - Chat with admin for questions
   - Upload additional documents

5. **Analytics Dashboard**
   - Approval/rejection trends
   - Most requested courses
   - Prerequisite gap analysis

---

## Related Documentation

- [Feature Plan](../specs/021-learning-path/plan.md)
- [API Contracts](../specs/021-learning-path/contracts/)
- [Tasks](../specs/021-learning-path/tasks.md)
- [Test Coverage](../tests/unit/services/TEST_COVERAGE_SUMMARY.md)

---

## Questions?

For questions or issues with the PRE_BOOKED workflow:
1. Check this documentation
2. Review unit tests for expected behavior
3. Search Rollbar for related errors
4. Check Loops.so email logs
5. Contact team lead or create GitHub issue
