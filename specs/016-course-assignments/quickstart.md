# Quickstart: Course Assignments Participation Flow

> **Full Documentation**: See [docs/features/course-assignments.md](../../docs/features/course-assignments.md)

## Prerequisites

- Node.js 18+, npm 9+
- PostgreSQL database configured
- Clerk, Mux, Vercel Blob credentials in `.env.local`

## 1. Prepare Environment

```bash
# Ensure all dependencies installed
npm install

# Required .env.local variables
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
DATABASE_URL=postgresql://...
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

## 2. Generate Database Artifacts

```bash
# Apply migration
npx prisma migrate dev --name 016-course-participation

# Regenerate client
npm run prisma:generate
```

## 3. Seed Sample Data

```bash
# Full E2E seed with bookings and assets
npm run seed:e2e

# Or use existing seed
npx tsx prisma/seed.ts
```

### Manual Summary Asset Seeding

```sql
-- Insert course-level summary asset
INSERT INTO course_summary_assets (id, course_id, mux_playback_id, title, description, position, created_at, updated_at)
VALUES (
  'cuid_generated',
  'your_course_id',
  'your_mux_playback_id',
  'Zusammenfassung: Verhandlungstechniken',
  'Video-Zusammenfassung der wichtigsten Strategien',
  1,
  NOW(),
  NOW()
);
```

## 4. Run Tests

```bash
# Unit tests
npm test -- course-participation

# Contract tests
npm test -- tests/contracts/016-course-assignments

# E2E tests
npx playwright test --grep "course participation"
```

## 5. Manual Verification

1. Start dev server: `npm run dev`
2. Sign in as participant at `http://localhost:3000/sign-in`
3. Navigate to `http://localhost:3000/my-courses`
4. Complete the 4-step workflow:
   - **Vorbereitung**: Fill goals, desired results, manager profile
   - **Lebenslauf**: Upload PDF (max 5MB)
   - **Zusammenfassung**: Watch video assets (if available)
   - **Nachbereitung**: Plan discussion, set salary month
   - **Ergebnisse**: Document negotiation outcome

## 6. Observability Checks

```bash
# Trigger error for Rollbar verification
curl -X POST http://localhost:3000/api/my-courses/invalid-id/resume \
  -H "Content-Type: application/pdf" \
  -d "invalid data"
```

Check Rollbar dashboard for structured error with:
- `participationId`
- `bookingId`
- `userId`
- `event_type: participation.*`

## Common Issues

| Issue | Solution |
|-------|----------|
| Migration fails | Check DATABASE_URL, ensure DB exists |
| Video not playing | Verify MUX_TOKEN_ID/SECRET, check asset status |
| Upload fails | Verify BLOB_READ_WRITE_TOKEN, check file size (<5MB) |
| Step skipped | Summary step hides when no assets exist |

## API Quick Reference

| Endpoint | Methods |
|----------|---------|
| `/api/my-courses/[bookingId]/preparation` | GET, PUT |
| `/api/my-courses/[bookingId]/resume` | GET, POST, DELETE |
| `/api/my-courses/[bookingId]/summary` | GET, PUT |
| `/api/my-courses/[bookingId]/debriefing` | GET, PUT |
| `/api/my-courses/[bookingId]/results` | GET, PUT |
