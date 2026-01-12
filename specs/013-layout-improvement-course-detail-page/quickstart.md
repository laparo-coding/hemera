# Quickstart: Course Detail Page Layout Improvement

**Feature**: 013-layout-improvement-course-detail-page  
**Date**: 2026-01-08

---

## Prerequisites

- Node.js 18+
- PostgreSQL database running
- Mux account with API credentials (already configured in project)
- Environment variables set (see `.env.local.example`)

---

## Setup Steps

### 1. Install Dependencies

```bash
# No new dependencies required
# @mux/mux-player-react already installed for Feature 016
npm install
```

### 2. Apply Database Migration

```bash
# Create and apply migration for heroVideoPlaybackId field
npx prisma migrate dev --name add_hero_video_playback_id
```

### 3. Update Seed Data (Optional)

Add Mux test playback IDs to courses in `prisma/seed.ts`:

```typescript
// Example Mux test playback IDs
const courses = [
  {
    // ... existing fields
    heroVideoPlaybackId: 'xyw0xyx00D02TUYCpZjG6aKnHqI2tYTG00', // Mux test asset
  },
];
```

```bash
npx prisma db seed
```

### 4. Verify Mux Configuration

Ensure these environment variables are set:

```bash
# .env.local
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_env_key  # Optional, for analytics
```

---

## Development

### Start Development Server

```bash
npm run dev
```

### View Course Detail Page

Navigate to: `http://localhost:3000/courses/grundkurs-verhandlungstraining`

### Run Tests

```bash
# Unit tests
npm test -- --testPathPattern="course-detail"

# E2E tests
npm run test:e2e -- --grep="course detail"
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/courses/[id]/page.tsx` | Page route (update to use new layout) |
| `components/course-detail/` | New component folder |
| `lib/design-tokens.ts` | Centralized design tokens |
| `prisma/schema.prisma` | Course model with new field |

---

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Course with `heroVideoPlaybackId` shows video
- [ ] Course without video shows fallback image
- [ ] All CTAs link to checkout
- [ ] Page loads < 1.5s on localhost
- [ ] Mobile responsive at 375px width
- [ ] Lighthouse accessibility score > 90

---

## Rollback

If issues occur:

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back add_hero_video_playback_id

# Revert to legacy CourseDetail component
# (Legacy component preserved in components/CourseDetail.tsx)
```

---

## Common Issues

### Video Not Playing
- Check browser console for Mux errors
- Verify `heroVideoPlaybackId` is valid Mux Playback ID
- Ensure Mux credentials are set in environment

### Styling Issues
- Clear Next.js cache: `rm -rf .next`
- Verify design tokens import path

### Database Issues
- Run `npx prisma generate` after schema changes
- Check Prisma Studio: `npx prisma studio`
