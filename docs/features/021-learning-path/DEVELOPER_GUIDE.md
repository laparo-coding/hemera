# PRE_BOOKED Review - Developer Guide

## Quick Reference

### API Endpoint

```
PATCH /api/admin/bookings/[id]/review
```

### Request Body

```typescript
{
  "action": "approve" | "reject"
}
```

---

## How to Approve a PRE_BOOKED Booking

### Step 1: Validate Status

```typescript
// Ensure booking is PRE_BOOKED before processing
if (booking.paymentStatus !== 'PRE_BOOKED') {
  return res.status(409).json({ error: 'Not in review status' });
}
```

### Step 2: Use Atomic Update

```typescript
// CRITICAL: Use updateMany with status precondition
const result = await prisma.booking.updateMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // ✅ Atomic precondition prevents race conditions
  },
  data: {
    paymentStatus: 'PENDING',    // → User can now proceed to payment
    reviewedAt: new Date(),      // ✅ Required: Timestamp of review
    reviewedBy: userId,          // ✅ Required: Admin who approved
  },
});

// Check if update succeeded
if (result.count === 0) {
  // Status changed during review → abort
  return res.status(409).json({ error: 'Booking changed during review' });
}
```

### Step 3: Return Updated Booking

```typescript
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
});

return res.status(200).json({
  id: booking.id,
  paymentStatus: 'PENDING',
  reviewedAt: booking.reviewedAt,
  reviewedBy: booking.reviewedBy,
});
```

---

## How to Reject a PRE_BOOKED Booking

### Step 1: Send Rejection Email

```typescript
import { sendBookingRejectedEmail } from '@/lib/services/loops';

// Validate email first
const customerEmail = booking.user.email?.trim();
if (customerEmail && customerEmail.length > 0) {
  await sendBookingRejectedEmail({
    customerEmail,
    customerName: booking.user.name?.split(' ')[0] || 'Teilnehmer',
    courseTitle: booking.course.title,
  });
}
```

### Step 2: Use Atomic Delete

```typescript
// CRITICAL: Use deleteMany with status precondition
const result = await prisma.booking.deleteMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // ✅ Atomic precondition
  },
});

// Check if delete succeeded
if (result.count === 0) {
  // Status changed during review → abort
  return res.status(409).json({ error: 'Booking changed during review' });
}
```

### Step 3: Return Success

```typescript
return res.status(200).json({ message: 'Booking rejected and removed' });
```

---

## Database Schema Reference

### Booking Model Fields

| Field | Type | Purpose | Set When |
|-------|------|---------|----------|
| `paymentStatus` | `PaymentStatus` | Current booking state | Always |
| `reviewedAt` | `DateTime?` | When admin reviewed | On **approve** only |
| `reviewedBy` | `String?` | Admin user ID | On **approve** only |

### PaymentStatus Flow

```
PRE_BOOKED → PENDING   (approve → reviewedAt, reviewedBy set)
PRE_BOOKED → deleted   (reject → booking removed)
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use `update()` instead of `updateMany()`

```typescript
// ❌ WRONG: No race condition protection
await prisma.booking.update({
  where: { id: bookingId },
  data: { paymentStatus: 'PENDING' },
});
```

### ✅ DO: Use `updateMany()` with status precondition

```typescript
// ✅ CORRECT: Atomic operation with precondition
const result = await prisma.booking.updateMany({
  where: { 
    id: bookingId,
    paymentStatus: 'PRE_BOOKED', // Ensures booking hasn't changed
  },
  data: { paymentStatus: 'PENDING' },
});

if (result.count === 0) {
  // Handle race condition
}
```

### ❌ DON'T: Forget to validate email before sending

```typescript
// ❌ WRONG: Can fail with empty email
await sendBookingRejectedEmail({
  customerEmail: booking.user.email, // May be null/empty
  ...
});
```

### ✅ DO: Validate and trim email first

```typescript
// ✅ CORRECT: Validate before sending
const customerEmail = booking.user.email?.trim();
if (customerEmail && customerEmail.length > 0) {
  await sendBookingRejectedEmail({ customerEmail, ... });
}
```

### ❌ DON'T: Set `reviewedAt`/`reviewedBy` on rejection

```typescript
// ❌ WRONG: These fields are for approvals only
await prisma.booking.deleteMany({
  where: { id: bookingId },
  data: { 
    reviewedAt: new Date(),  // Don't set on delete!
    reviewedBy: userId,       // Don't set on delete!
  },
});
```

### ✅ DO: Only set review fields on approve

```typescript
// ✅ CORRECT: Review fields only for approved bookings
// On rejection, just delete the booking
await prisma.booking.deleteMany({
  where: { id: bookingId, paymentStatus: 'PRE_BOOKED' },
});
```

---

## Security Checklist

Before processing a review request:

- [ ] **Authentication**: Verify user is logged in
- [ ] **Authorization**: Check `isAdmin` flag (see `checkUserAdminStatus()`)
- [ ] **Booking ID Validation**: Ensure ID is valid CUID
- [ ] **Status Check**: Verify booking is PRE_BOOKED
- [ ] **Atomic Operations**: Use `updateMany`/`deleteMany` with preconditions
- [ ] **Email Validation**: Check email exists and trim whitespace
- [ ] **Error Logging**: Use `serverInstance.error()`, never log full error objects

---

## Testing Guide

### Unit Test: Approve Flow

```typescript
it('should approve PRE_BOOKED booking with reviewedAt and reviewedBy', async () => {
  const booking = await createTestBooking({ paymentStatus: 'PRE_BOOKED' });
  
  const result = await prisma.booking.updateMany({
    where: { id: booking.id, paymentStatus: 'PRE_BOOKED' },
    data: {
      paymentStatus: 'PENDING',
      reviewedAt: new Date(),
      reviewedBy: 'admin_123',
    },
  });
  
  expect(result.count).toBe(1);
  
  const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
  expect(updated.paymentStatus).toBe('PENDING');
  expect(updated.reviewedAt).toBeDefined();
  expect(updated.reviewedBy).toBe('admin_123');
});
```

### Unit Test: Reject Flow

```typescript
it('should delete PRE_BOOKED booking and send email', async () => {
  const booking = await createTestBooking({ 
    paymentStatus: 'PRE_BOOKED',
    user: { email: 'test@example.com' },
  });
  
  const result = await prisma.booking.deleteMany({
    where: { id: booking.id, paymentStatus: 'PRE_BOOKED' },
  });
  
  expect(result.count).toBe(1);
  
  const deleted = await prisma.booking.findUnique({ where: { id: booking.id } });
  expect(deleted).toBeNull();
});
```

### Unit Test: Race Condition Protection

```typescript
it('should prevent double approval with atomic updateMany', async () => {
  const booking = await createTestBooking({ paymentStatus: 'PRE_BOOKED' });
  
  // Simulate concurrent approvals
  const [result1, result2] = await Promise.all([
    prisma.booking.updateMany({
      where: { id: booking.id, paymentStatus: 'PRE_BOOKED' },
      data: { paymentStatus: 'PENDING' },
    }),
    prisma.booking.updateMany({
      where: { id: booking.id, paymentStatus: 'PRE_BOOKED' },
      data: { paymentStatus: 'PENDING' },
    }),
  ]);
  
  // Only one should succeed
  expect(result1.count + result2.count).toBe(1);
});
```

---

## Implementation Reference

**Live Implementation:**
- API Route: [`app/api/admin/bookings/[id]/review/route.ts`](../../../app/api/admin/bookings/[id]/review/route.ts)
- Schema: [`lib/schemas/admin/booking.ts`](../../../lib/schemas/admin/booking.ts)
- Email Service: [`lib/services/loops.ts`](../../../lib/services/loops.ts)
- Tests: [`tests/unit/api/admin-booking-review.spec.ts`](../../../tests/unit/api/admin-booking-review.spec.ts)

**Related Documentation:**
- [Complete Workflow](./PRE_BOOKED_APPROVAL_WORKFLOW.md) - Full feature documentation
- [Quick Start](./QUICK_START.md) - Overview for new developers
- [Booking Transitions](../../../tests/unit/services/booking-transitions.spec.ts) - All valid status transitions

---

## When to Update This Guide

Update this document when:
- Adding new review actions (beyond approve/reject)
- Changing database schema (new fields, constraints)
- Modifying atomic operation patterns
- Adding new security requirements
- Changing email notification logic

**Last Updated:** 2026-01-27  
**Feature:** 021-learning-path  
**Branch:** `021-learning-path`
