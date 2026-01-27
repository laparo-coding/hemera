# Quickstart: Testimonial Management

**Feature**: 017-testimonial-management  
**Date**: 2025-01-15

## Prerequisites

- Node.js 18+
- PostgreSQL database running
- Environment variables configured (`.env.local`)
- Clerk authentication configured
- At least one published course with a confirmed booking

## Setup

```bash
# Install dependencies
npm install

# Run database migrations (after Prisma schema update)
npx prisma migrate dev --name add-testimonial-model

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## Validation Steps

### 1. Create Test Data

```bash
# Ensure you have a test user with a confirmed booking
npx prisma studio
# Verify: bookings table has at least one CONFIRMED/PAID booking
```

### 2. Participant Submits Testimonial

1. Sign in as the participant user (via Clerk)
2. Navigate to `/my-courses`
3. Click on a course with a confirmed booking
4. Scroll to the testimonial section
5. Enter a statement (max 1000 chars)
6. Select name display format (A/B/C/D – option A hidden if no city in profile)
7. Verify the live preview matches expected output
8. Submit the testimonial
9. ✅ **Expected**: Success message, testimonial saved with status PENDING

### 3. Verify PENDING Status

```bash
npx prisma studio
# Check testimonials table: status = 'PENDING'
```

### 4. Admin Approves Testimonial

1. Sign in as admin user
2. Navigate to `/admin/testimonials`
3. Find the pending testimonial in the list
4. Click "Approve" (Freigeben)
5. ✅ **Expected**: Status changes to PUBLISHED

### 5. Verify Display on Course Page

1. Sign out or open incognito window
2. Navigate to `/courses/[slug]` (the course for which testimonial was submitted)
3. Scroll to section below "Termin und Preis"
4. ✅ **Expected**: Testimonial appears with:
   - Profile photo (or default avatar)
   - Formatted name per selected option
   - Statement text

### 6. Edit Testimonial (Participant)

1. Sign in as participant
2. Navigate to `/my-courses/[slug]`
3. Edit the existing testimonial statement
4. Submit changes
5. ✅ **Expected**: Changes saved (may revert to PENDING if re-moderation required)

### 7. Hide Testimonial (Admin)

1. Sign in as admin
2. Navigate to `/admin/testimonials`
3. Click "Hide" (Ausblenden) on a published testimonial
4. ✅ **Expected**: Status changes to HIDDEN, no longer visible on course page

## Test Commands

```bash
# Run unit tests for testimonial components
npm test -- --testPathPattern=testimonial

# Run E2E tests for testimonial flow
npx playwright test tests/e2e/testimonials.spec.ts

# Run all tests
npm test
```

## API Quick Reference

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List (course) | GET | `/api/testimonials?courseId=X&status=PUBLISHED` | – |
| Create | POST | `/api/testimonials` | `{ bookingId, statement, nameDisplayFormat }` |
| Update | PATCH | `/api/testimonials/[id]` | `{ statement?, nameDisplayFormat?, status? }` |
| Approve | PATCH | `/api/testimonials/[id]` | `{ status: "PUBLISHED" }` |
| Hide | PATCH | `/api/testimonials/[id]` | `{ status: "HIDDEN" }` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Option A not showing | User has no city in Clerk profile metadata |
| Testimonial not appearing | Check status is PUBLISHED, not PENDING/HIDDEN |
| 401 on POST | User not authenticated via Clerk |
| 403 on approve | User lacks admin role |
| Duplicate error | User already has testimonial for this booking |
