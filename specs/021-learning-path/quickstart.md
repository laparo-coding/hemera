# Quickstart: 021 Learning Path

## Overview

This quickstart validates the complete Learning Path feature implementation.

## Prerequisites

1. Docker running (for local PostgreSQL)
2. Node.js 20+
3. Environment variables configured (see below)

## Environment Setup

```bash
# .env.local additions
LOOPS_API_KEY=loops_test_xxxxx   # Get from Loops.so dashboard
```

## Database Setup

```bash
# Start local PostgreSQL
npm run docker:up

# Run migration
npx prisma migrate dev --name learning_path

# Verify migration
npx prisma studio
# → Check: courses table has recommended, not_recommended, is_non_public columns
# → Check: users table has is_outperformer column
# → Check: PaymentStatus enum includes PRE_BOOKED
```

## Feature 1: Course Recommendation Fields

### Test Case 1.1: Admin can set recommendation fields

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to admin course form
open http://localhost:3000/admin/courses/new

# 3. Fill form including:
#    - Empfohlen für: "Führungskräfte mit 2+ Jahren Erfahrung"
#    - Nicht empfohlen für: "Berufseinsteiger ohne Führungserfahrung"

# 4. Verify fields are saved (check Prisma Studio)
npx prisma studio
```

### Test Case 1.2: Public course page shows recommendations

```bash
# Navigate to course detail page
open http://localhost:3000/courses/{slug}

# Verify: Recommendation section visible with both fields
```

## Feature 2: Prerequisite Booking Check

### Test Case 2.1: BEGINNER course - no check

```bash
# 1. Create a BEGINNER course
# 2. Book as any user
# 3. Verify: Booking created with status PENDING (not PRE_BOOKED)
```

### Test Case 2.2: INTERMEDIATE course - not qualified

```bash
# 1. Create an INTERMEDIATE course
# 2. Book as new user (no completed courses)
# 3. Verify:
#    - Booking created with status PRE_BOOKED
#    - Warning message displayed to user
#    - Admin notification email sent (check Loops.so dashboard or logs)
```

### Test Case 2.3: INTERMEDIATE course - qualified

```bash
# Setup: Create user with completed BEGINNER course
# 1. Create Booking for BEGINNER course with paymentStatus=PAID
# 2. Create CourseParticipation with status=COMPLETE

# Test:
# 1. Book INTERMEDIATE course as same user
# 2. Verify: Booking created with status PENDING (qualified)
```

### Test Case 2.4: Admin approves PRE_BOOKED

```bash
# 1. Navigate to pending bookings
open http://localhost:3000/admin/bookings/pending

# 2. Click "Genehmigen" on a PRE_BOOKED booking
# 3. Verify: Status changes to PENDING
# 4. Verify: reviewedAt and reviewedBy set
```

### Test Case 2.5: Admin rejects PRE_BOOKED

```bash
# 1. Navigate to pending bookings
# 2. Click "Ablehnen" on a PRE_BOOKED booking
# 3. Verify: Status changes to CANCELLED
# 4. Verify: Rejection email sent to customer
```

## Feature 3: Non-Public Course Flag

### Test Case 3.1: Non-public course hidden from listings

```bash
# 1. Create course with isNonPublic = true
# 2. Navigate to public course listing
open http://localhost:3000/courses

# 3. Verify: Course NOT visible in listing
```

### Test Case 3.2: Non-public course accessible via direct link

```bash
# 1. Navigate directly to non-public course
open http://localhost:3000/courses/{non-public-slug}

# 2. Verify: Course detail page renders
# 3. Verify: Can proceed to checkout
```

## Feature 4: Outperformer Flag

### Test Case 4.1: Admin can toggle outperformer

```bash
# 1. Navigate to user in admin (or database page)
# 2. Toggle isOutperformer checkbox
# 3. Verify: Flag persisted in database
```

## Validation Script

```bash
# Run all tests
npm test

# Run specific learning path tests
npm test -- --grep "learning-path"
npm test -- --grep "prerequisite"
npm test -- --grep "loops"

# Run E2E tests
npm run test:e2e -- --grep "booking-prerequisite"
```

## Troubleshooting

### Loops.so emails not sending

1. Check `LOOPS_API_KEY` is set correctly
2. Check Rollbar for logged errors
3. Verify transactional templates exist in Loops.so dashboard:
   - `prerequisite-review`
   - `booking-rejected`

### Prerequisite check always returns not qualified

1. Verify CourseParticipation exists with `status = 'COMPLETE'`
2. Verify Booking has `paymentStatus = 'PAID'`
3. Check user's Clerk emails match the booking's user email

### PRE_BOOKED status not appearing

1. Verify migration was applied: `npx prisma migrate status`
2. Regenerate Prisma client: `npx prisma generate`
3. Check course level is INTERMEDIATE or ADVANCED

## Success Criteria

- [ ] All 4 features work as specified
- [ ] Admin review workflow complete (approve/reject)
- [ ] Email notifications sent (or silently logged on failure)
- [ ] Non-public courses hidden from listings
- [ ] Outperformer flag toggleable
- [ ] No console.error in production code
- [ ] All errors logged to Rollbar
