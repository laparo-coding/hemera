# Quickstart: User Course Management (Spec 027)

**Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js 18+ / npm 9+
- Next.js 16 (App Router)
- PostgreSQL 16 (or Docker `docker compose up db`)
- `.env.local` with valid:
  - `DATABASE_URL` — PostgreSQL connection string
  - `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk auth
  - `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` — Mux video (for Nachbereitung page)

## Setup

```bash
# 1. Checkout feature branch
git checkout -b 027-user-course-management

# 2. Install dependencies (verify @mui/x-date-pickers is present)
npm install
# If @mui/x-date-pickers is missing:
# npm install @mui/x-date-pickers date-fns

# 3. Run Prisma migration for new fields
npx prisma migrate dev --name add_result_date_and_negotiation_partner

# 4. Generate Prisma client
npx prisma generate

# 5. Seed test data (creates courses, bookings, and participations)
npx prisma db seed

# 6. Start dev server
npm run dev
```

## Verification Steps

### 1. Dashboard Stepper

1. Navigate to `/dashboard` as a user with at least one booking
2. Verify each booking shows a 4-step horizontal stepper: "Vorbereitung Seminar", "Seminarveranstaltung", "Nachbereitung Seminar", "Verhandlungsergebnis"
3. Steps should show correct states (active/completed/available) based on participation status
4. Click any step → navigates to correct page (all steps clickable during testing phase; in production, locked steps will be disabled with a tooltip)
5. Active step label highlighted in marsala color

### 2. Preparation Substeps

1. Navigate to `/my-courses/{bookingId}` for a booking with participation in PREPARATION status
2. Stepper shows 5 numbered steps (Seminar-Absicht, Erwartete Ergebnisse, Dein Vorgesetzter, Lebenslauf, Zusammenfassung)
3. Each step shows only its own field
4. Click "Weiter" → advances to next step
5. Leave page and return → resumes at correct substep (abgeleitet daraus, welche Felder bereits nicht `null` sind; `""` = übersprungen, `null` = noch nicht besucht)

### 3. Testimonial Drawer

1. On dashboard, find a course card (any section except NO_SHOW — users who did not attend cannot write a testimonial)
2. Click "Erfahrungsbericht" button → right-side drawer opens
3. Fill in testimonial form and submit → drawer closes
4. Reopen drawer → existing testimonial shown in read mode

### 4. Nachbereitung Page

1. On dashboard, click "Nachbereitung Seminar" step (when active)
2. Navigates to `/my-courses/{bookingId}/nachbereitung`
3. Page shows video catalog grid (2 cols desktop, 1 col mobile)
4. Each video is playable inline via MuxPlayer
5. "Zurück zum Dashboard" link works

### 5. Verhandlungsergebnis Page

1. On dashboard, click "Verhandlungsergebnis" step (when active)
2. Navigates to `/my-courses/{bookingId}/verhandlungsergebnis`
3. Page shows: DatePicker — Tagesauswahl in Monatsansicht, card selector (3 options: "Mit meiner Führungskraft", "Mit der Führungskraft meiner Führungskraft", "Mit der Personalabteilung"), textarea
4. Fill fields and click "Verhandlungsergebnis speichern"
5. Return to page → values persisted

### 6. Detail Page Cleanup

1. Navigate to `/my-courses/{bookingId}`
2. Verify: No Nachbereitung section
3. Verify: No Ergebnis section
4. Verify: No Testimonial section
5. Verify: Heading reads "Vorbereitung Seminar" (not "Vorbereitung")

## Running Tests

```bash
# Unit tests for new components
npm test -- --testPathPattern="027|CourseProgressStepper|TestimonialDrawer|DebriefingVideoCatalog|NegotiationResultForm"

# All tests
npm test

# E2E tests
npm run test:e2e
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `resultDate` or `resultNegotiationPartner` not in Prisma types | Run `npx prisma generate` after migration |
| DatePicker locale not German | Ensure `LocalizationProvider` wraps with `adapterLocale={de}` (import `de` from `date-fns/locale/de`) |
| MuxPlayer SSR error | Verify dynamic import with `{ ssr: false }` |
| Dashboard stepper shows all locked | Check that `participationStatus` is returned from dashboard API |
| Testimonial drawer doesn't open | Verify `open` state management in CourseCard |
