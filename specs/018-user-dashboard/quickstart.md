# Quickstart: User Dashboard Enhancement

**Feature**: 018-user-dashboard  
**Branch**: `018-user-dashboard`

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or remote)
- Stripe test mode credentials
- Clerk credentials

## Setup

```bash
# Switch to feature branch
git checkout 018-user-dashboard

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## Testing the Feature

### 1. Dashboard Sections

1. Navigate to `/dashboard`
2. Verify 4 sections appear based on booking data:
   - "Nächstes Seminar" - next upcoming course
   - "Weitere gebuchte Seminare" - other future bookings
   - "Absolvierte Seminare" - completed courses with participation
   - "Seminare ohne Teilnahme" - past courses without participation

### 2. Course Card Display

1. Each card should show:
   - Course title
   - Start date (+ end date if multi-day)
   - Start time - End time
   - Location with link to `/locations/[slug]`

### 3. Invoice Download

1. For any paid booking, click "Rechnung herunterladen"
2. PDF should download from Stripe

### 4. User Course Detail Page

1. Click "Vorbereitung" on a course card
2. Navigate to `/my-courses/[bookingId]`
3. Verify tabs: Vorbereitung, Ergebnisse, Nachbereitung
4. Test URL anchors: `/my-courses/[id]#ergebnisse`

## Validation Checklist

### Functional Tests

- [ ] Dashboard loads successfully for authenticated user
- [ ] 4 sections display in correct order when data available
- [ ] Empty sections are automatically hidden
- [ ] Course cards show date, time, and location
- [ ] Location links navigate to `/locations/[slug]`
- [ ] "Vorbereitung" button links to course detail page
- [ ] "Details" button visible for completed courses
- [ ] Invoice download button appears for paid completed courses
- [ ] Invoice PDF downloads successfully from Stripe
- [ ] Course detail page shows back navigation to dashboard

### Section-Specific Tests

- [ ] "Nächstes Seminar" shows only ONE next upcoming course
- [ ] "Weitere gebuchte Seminare" shows remaining future bookings
- [ ] "Absolvierte Seminare" shows completed with participation
- [ ] "Seminare ohne Teilnahme" shows completed without participation

### URL Anchor Navigation

- [ ] `/my-courses/[id]#vorbereitung` scrolls to preparation section
- [ ] `/my-courses/[id]#ergebnisse` scrolls to results section
- [ ] `/my-courses/[id]#nachbereitung` scrolls to debriefing section

### Performance

- [ ] Dashboard loads in < 2 seconds
- [ ] No layout shift after initial render
- [ ] Invoice download initiates immediately on click

### Mobile Responsiveness

- [ ] Dashboard displays correctly on mobile (< 768px)
- [ ] Course cards stack properly on small screens
- [ ] Date/time/location info readable on mobile
- [ ] Buttons are touch-friendly (min 44px height)

### German Localization

- [ ] All labels use informal "Du" form
- [ ] Date format: DD.MM.YYYY
- [ ] Time format: HH:MM Uhr
- [ ] Section headers in German

### Error Handling

- [ ] Invoice download shows error toast on failure
- [ ] Dashboard shows error message if API fails
- [ ] Errors logged to Rollbar with context

## Troubleshooting

### Invoice not available

- Check Stripe webhook logs for `checkout.session.completed` event
- Verify `stripeInvoicePdfUrl` is populated in Booking record
- Ensure Stripe checkout created an invoice (not all payment types do)

### Course not appearing in correct section

- Check `course.startDate` and `course.endDate` values
- Verify `participation` record exists/doesn't exist as expected
- Check `booking.paymentStatus` is not CANCELLED

### Location link broken

- Verify course has `locationId` set
- Check location has valid `slug`
